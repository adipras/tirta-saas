package com.adipras.tirtasaas.printerbridge

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ListView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.adipras.tirtasaas.printerbridge.printer.ThermalPrinterDevice
import com.adipras.tirtasaas.printerbridge.service.PrinterBridgeService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var textBridgeStatus: TextView
    private lateinit var textEndpoint: TextView
    private lateinit var textPrinterStatus: TextView
    private lateinit var textPreferredPrinter: TextView
    private lateinit var buttonStartBridge: Button
    private lateinit var buttonStopBridge: Button
    private lateinit var buttonRefreshStatus: Button
    private lateinit var buttonRefreshPrinters: Button
    private lateinit var printerListView: ListView

    private var bridgeService: PrinterBridgeService? = null
    private var isBound = false
    private var availablePrinters: List<ThermalPrinterDevice> = emptyList()

    private lateinit var printerAdapter: ArrayAdapter<String>

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            refreshBridgeStatus()
            refreshPrinters()
        }

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            bridgeService = (service as? PrinterBridgeService.LocalBinder)?.getService()
            isBound = true
            refreshBridgeStatus()
            refreshPrinters()
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            bridgeService = null
            isBound = false
            refreshBridgeStatus()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        bindViews()
        setupPrinterList()
        setupButtons()

        requestRuntimePermissionsIfNeeded()
        startBridgeService()
        bindBridgeService()
    }

    override fun onResume() {
        super.onResume()
        refreshBridgeStatus()
        refreshPrinters()
    }

    override fun onDestroy() {
        if (isBound) {
            unbindService(serviceConnection)
            isBound = false
        }
        super.onDestroy()
    }

    private fun bindViews() {
        textBridgeStatus = findViewById(R.id.textBridgeStatus)
        textEndpoint = findViewById(R.id.textEndpoint)
        textPrinterStatus = findViewById(R.id.textPrinterStatus)
        textPreferredPrinter = findViewById(R.id.textPreferredPrinter)
        buttonStartBridge = findViewById(R.id.buttonStartBridge)
        buttonStopBridge = findViewById(R.id.buttonStopBridge)
        buttonRefreshStatus = findViewById(R.id.buttonRefreshStatus)
        buttonRefreshPrinters = findViewById(R.id.buttonRefreshPrinters)
        printerListView = findViewById(R.id.listPrinters)
    }

    private fun setupButtons() {
        buttonStartBridge.setOnClickListener {
            startBridgeService()
            bindBridgeService()
            refreshBridgeStatus()
        }

        buttonStopBridge.setOnClickListener {
            val stopIntent = Intent(this, PrinterBridgeService::class.java).setAction(PrinterBridgeService.ACTION_STOP)
            startService(stopIntent)
            showToast("Bridge printer dihentikan")
            refreshBridgeStatus()
        }

        buttonRefreshStatus.setOnClickListener { refreshBridgeStatus() }
        buttonRefreshPrinters.setOnClickListener { refreshPrinters() }
    }

    private fun setupPrinterList() {
        printerAdapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, mutableListOf())
        printerListView.adapter = printerAdapter
        printerListView.setOnItemClickListener { _, _, position, _ ->
            val device = availablePrinters.getOrNull(position) ?: return@setOnItemClickListener
            connectPrinter(device)
        }
    }

    private fun connectPrinter(device: ThermalPrinterDevice) {
        val service = bridgeService
        if (service == null) {
            showToast("Bridge printer belum siap")
            return
        }

        setBusy(true)
        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                service.connectPrinter(device.id)
            }
            setBusy(false)
            showToast(result.message)
            refreshBridgeStatus()
        }
    }

    private fun refreshBridgeStatus() {
        val status = bridgeService?.getBridgeStatus()
        if (status == null) {
            textBridgeStatus.text = "Status bridge: belum tersambung ke service"
            textEndpoint.text = "Endpoint: http://127.0.0.1:3000"
            textPrinterStatus.text = "Status printer: Belum terhubung"
            textPreferredPrinter.text = "Printer favorit: -"
            return
        }

        textBridgeStatus.text = if (status.bridgeRunning) {
            "Status bridge: aktif"
        } else {
            "Status bridge: tidak aktif"
        }
        textEndpoint.text = "Endpoint: ${status.serverUrl}"
        textPrinterStatus.text = buildString {
            append("Status printer: ")
            append(if (status.connected) "Terhubung" else "Belum terhubung")
            if (!status.message.isNullOrBlank()) {
                append(" • ")
                append(status.message)
            }
        }
        textPreferredPrinter.text = "Printer favorit: ${status.preferredPrinterName ?: "-"}"
    }

    private fun refreshPrinters() {
        val service = bridgeService
        if (service == null) {
            return
        }

        lifecycleScope.launch {
            val printers = withContext(Dispatchers.IO) {
                service.listPrinters()
            }
            availablePrinters = printers
            printerAdapter.clear()
            printerAdapter.addAll(
                printers.map { device ->
                    if (device.address.isBlank()) {
                        device.name
                    } else {
                        "${device.name} • ${device.address}"
                    }
                },
            )
            printerAdapter.notifyDataSetChanged()
        }
    }

    private fun setBusy(isBusy: Boolean) {
        val enabled = !isBusy
        buttonStartBridge.isEnabled = enabled
        buttonStopBridge.isEnabled = enabled
        buttonRefreshStatus.isEnabled = enabled
        buttonRefreshPrinters.isEnabled = enabled
        printerListView.isEnabled = enabled
    }

    private fun requestRuntimePermissionsIfNeeded() {
        val permissions = buildList {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                add(Manifest.permission.BLUETOOTH_CONNECT)
                add(Manifest.permission.BLUETOOTH_SCAN)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        val missingPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            permissionLauncher.launch(missingPermissions.toTypedArray())
        }
    }

    private fun startBridgeService() {
        val intent = Intent(this, PrinterBridgeService::class.java).setAction(PrinterBridgeService.ACTION_START)
        ContextCompat.startForegroundService(this, intent)
    }

    private fun bindBridgeService() {
        if (isBound) {
            return
        }
        val intent = Intent(this, PrinterBridgeService::class.java)
        bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
