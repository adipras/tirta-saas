package com.adipras.tirtasaas.feature.printer

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import timber.log.Timber
import java.io.IOException
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BluetoothPrinterManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val TAG = "BluetoothPrinterManager"
        private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    }

    private val bluetoothManager: BluetoothManager by lazy {
        context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    }
    private val bluetoothAdapter: BluetoothAdapter? get() = bluetoothManager.adapter

    private var socket: BluetoothSocket? = null
    private var connectedDevice: BluetoothDevice? = null

    private val _connectedDeviceName = MutableStateFlow<String?>(null)
    val connectedDeviceName: StateFlow<String?> = _connectedDeviceName.asStateFlow()

    private val _connectedDeviceAddress = MutableStateFlow<String?>(null)
    val connectedDeviceAddress: StateFlow<String?> = _connectedDeviceAddress.asStateFlow()

    val isBluetoothEnabled: Boolean get() = bluetoothAdapter?.isEnabled == true

    @Throws(SecurityException::class)
    fun getPairedDevices(): Set<BluetoothDevice> {
        return bluetoothAdapter?.bondedDevices ?: emptySet()
    }

    suspend fun connect(device: BluetoothDevice): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            disconnect()
            Timber.tag(TAG).d("Connecting to ${device.address}")
            @Suppress("DEPRECATION")
            val newSocket = device.createRfcommSocketToServiceRecord(SPP_UUID)
            bluetoothAdapter?.cancelDiscovery()
            newSocket.connect()
            socket = newSocket
            connectedDevice = device
            val name = try {
                device.name
            } catch (e: SecurityException) {
                device.address
            }
            _connectedDeviceName.value = name
            _connectedDeviceAddress.value = device.address
            Timber.tag(TAG).d("Connected to $name")
            Result.success(Unit)
        } catch (e: IOException) {
            Timber.tag(TAG).e(e, "Failed to connect")
            Result.failure(e)
        } catch (e: SecurityException) {
            Timber.tag(TAG).e(e, "Security exception connecting")
            Result.failure(e)
        }
    }

    suspend fun disconnect() = withContext(Dispatchers.IO) {
        try {
            socket?.close()
        } catch (e: IOException) {
            Timber.tag(TAG).e(e, "Error closing socket")
        } finally {
            socket = null
            connectedDevice = null
            _connectedDeviceName.value = null
            _connectedDeviceAddress.value = null
        }
    }

    suspend fun print(bytes: ByteArray): Result<Unit> = withContext(Dispatchers.IO) {
        val currentSocket = socket
        if (currentSocket == null || !currentSocket.isConnected) {
            return@withContext Result.failure(IOException("No printer connected"))
        }
        try {
            currentSocket.outputStream.write(bytes)
            currentSocket.outputStream.flush()
            Timber.tag(TAG).d("Printed ${bytes.size} bytes")
            Result.success(Unit)
        } catch (e: IOException) {
            Timber.tag(TAG).e(e, "Print failed")
            _connectedDeviceName.value = null
            _connectedDeviceAddress.value = null
            socket = null
            connectedDevice = null
            Result.failure(e)
        }
    }
}
