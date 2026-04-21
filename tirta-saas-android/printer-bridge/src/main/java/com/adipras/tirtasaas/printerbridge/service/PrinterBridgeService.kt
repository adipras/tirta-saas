package com.adipras.tirtasaas.printerbridge.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.adipras.tirtasaas.printerbridge.MainActivity
import com.adipras.tirtasaas.printerbridge.R
import com.adipras.tirtasaas.printerbridge.http.PrinterBridgeController
import com.adipras.tirtasaas.printerbridge.http.PrinterHttpServer
import com.adipras.tirtasaas.printerbridge.printer.PrinterBridgeStatus
import com.adipras.tirtasaas.printerbridge.printer.PrinterOperationResult
import com.adipras.tirtasaas.printerbridge.printer.ThermalPrinterDevice
import com.adipras.tirtasaas.printerbridge.printer.ThermalPrinterManager
import fi.iki.elonen.NanoHTTPD

class PrinterBridgeService : Service(), PrinterBridgeController {
    private val binder = LocalBinder()
    private lateinit var thermalPrinterManager: ThermalPrinterManager
    private var httpServer: PrinterHttpServer? = null
    private var bridgeRunning: Boolean = false

    override fun onCreate() {
        super.onCreate()
        thermalPrinterManager = ThermalPrinterManager(applicationContext)
        createNotificationChannel()
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopBridge()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }

            else -> startBridge()
        }

        return START_STICKY
    }

    override fun onDestroy() {
        stopBridge()
        super.onDestroy()
    }

    override fun getBridgeStatus(): PrinterBridgeStatus =
        thermalPrinterManager.buildStatus(bridgeRunning)

    override fun listPrinters(): List<ThermalPrinterDevice> =
        thermalPrinterManager.listPairedPrinters()

    override fun connectPrinter(deviceId: String?): PrinterOperationResult {
        val result = thermalPrinterManager.connect(deviceId)
        refreshNotification()
        return PrinterOperationResult(
            success = result.success,
            message = result.message,
            status = getBridgeStatus(),
        )
    }

    override fun printPayload(payloadJson: String): PrinterOperationResult {
        val result = thermalPrinterManager.printReceipt(payloadJson)
        refreshNotification()
        return PrinterOperationResult(
            success = result.success,
            message = result.message,
            status = getBridgeStatus(),
        )
    }

    @Synchronized
    fun startBridge() {
        if (!bridgeRunning) {
            startForeground(NOTIFICATION_ID, buildNotification(getBridgeStatus()))

            try {
                httpServer = PrinterHttpServer(this).also {
                    it.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false)
                }
                bridgeRunning = true
                thermalPrinterManager.setStatusMessage("Bridge aktif di http://127.0.0.1:3000")
            } catch (error: Exception) {
                bridgeRunning = false
                thermalPrinterManager.setStatusMessage(
                    "Bridge gagal aktif: ${error.message ?: "unknown error"}",
                )
            }
        } else {
            startForeground(NOTIFICATION_ID, buildNotification(getBridgeStatus()))
        }

        refreshNotification()
    }

    @Synchronized
    fun stopBridge() {
        httpServer?.stop()
        httpServer = null
        bridgeRunning = false
        thermalPrinterManager.shutdown()
    }

    private fun refreshNotification() {
        val notificationManager = ContextCompat.getSystemService(this, NotificationManager::class.java)
        notificationManager?.notify(NOTIFICATION_ID, buildNotification(getBridgeStatus()))
    }

    private fun buildNotification(status: PrinterBridgeStatus): Notification {
        val contentIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val contentText = when {
            status.connected && !status.printerName.isNullOrBlank() ->
                "Bridge aktif • ${status.printerName}"

            status.bridgeRunning ->
                "Bridge aktif di http://127.0.0.1:3000"

            else ->
                "Bridge tidak aktif"
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setOngoing(true)
            .setContentIntent(contentIntent)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val notificationManager = ContextCompat.getSystemService(this, NotificationManager::class.java)
            ?: return

        val channel = NotificationChannel(
            CHANNEL_ID,
            "Bridge Printer Thermal",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Menjaga bridge printer thermal tetap aktif di latar belakang"
        }
        notificationManager.createNotificationChannel(channel)
    }

    inner class LocalBinder : Binder() {
        fun getService(): PrinterBridgeService = this@PrinterBridgeService
    }

    companion object {
        const val ACTION_START = "com.adipras.tirtasaas.printerbridge.action.START"
        const val ACTION_STOP = "com.adipras.tirtasaas.printerbridge.action.STOP"
        private const val CHANNEL_ID = "printer_bridge_service"
        private const val NOTIFICATION_ID = 3000
    }
}
