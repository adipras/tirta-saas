package com.adipras.tirtasaas.feature.printer

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import timber.log.Timber
import java.io.IOException
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

@Singleton
class BluetoothPrinterManager @Inject constructor() {

    private var socket: BluetoothSocket? = null
    private var connectedDevice: BluetoothDevice? = null

    val isConnected: Boolean get() = socket?.isConnected == true

    fun getPairedPrinters(adapter: BluetoothAdapter): List<BluetoothDevice> = try {
        adapter.bondedDevices?.toList() ?: emptyList()
    } catch (e: SecurityException) {
        Timber.w(e, "Missing Bluetooth permission")
        emptyList()
    }

    suspend fun connect(device: BluetoothDevice): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            disconnect()
            val s = device.createRfcommSocketToServiceRecord(SPP_UUID)
            s.connect()
            socket = s
            connectedDevice = device
        }
    }

    fun disconnect() {
        try { socket?.close() } catch (e: IOException) { Timber.w(e, "Error closing socket") }
        socket = null
        connectedDevice = null
    }

    suspend fun print(bytes: ByteArray): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val out = socket?.outputStream ?: error("Tidak terhubung ke printer")
            out.write(bytes)
            out.flush()
        }
    }

    fun connectedDeviceName(): String? = connectedDevice?.name
    fun connectedDeviceAddress(): String? = connectedDevice?.address
}
