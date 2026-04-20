package com.adipras.tirtasaas.kasirkeliling.printer

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.nio.charset.StandardCharsets
import java.util.UUID

class ThermalPrinterManager(private val context: Context) {
    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private val sppUuid: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    private var connectedSocket: BluetoothSocket? = null
    private var connectedDevice: BluetoothDevice? = null
    private var lastStatusMessage: String = "Belum terhubung"

    @SuppressLint("MissingPermission")
    fun getPairedPrintersJson(): String {
        if (bluetoothAdapter == null) {
            lastStatusMessage = "Bluetooth tidak tersedia pada perangkat ini"
            return "[]"
        }
        if (!hasBluetoothPermission()) {
            lastStatusMessage = "Izin Bluetooth belum diberikan"
            return "[]"
        }

        val devices = bluetoothAdapter.bondedDevices
            .sortedBy { it.name ?: it.address }

        val jsonArray = JSONArray()
        devices.forEach { device ->
            jsonArray.put(
                JSONObject()
                    .put("id", device.address)
                    .put("name", device.name ?: "Printer Tanpa Nama")
                    .put("address", device.address),
            )
        }
        lastStatusMessage = if (devices.isEmpty()) {
            "Tidak ada printer Bluetooth yang sudah dipasangkan"
        } else {
            "${devices.size} printer tersedia"
        }
        return jsonArray.toString()
    }

    @SuppressLint("MissingPermission")
    fun connect(deviceId: String): String {
        if (bluetoothAdapter == null) {
            return errorResult("Bluetooth tidak tersedia pada perangkat ini")
        }
        if (!hasBluetoothPermission()) {
            return errorResult("Izin Bluetooth belum diberikan")
        }

        val device = bluetoothAdapter.bondedDevices.firstOrNull { it.address == deviceId }
            ?: return errorResult("Printer tidak ditemukan di daftar perangkat terpasang")

        return try {
            connectedSocket?.closeQuietly()
            bluetoothAdapter.cancelDiscovery()

            val socket = device.createRfcommSocketToServiceRecord(sppUuid)
            socket.connect()

            connectedSocket = socket
            connectedDevice = device
            lastStatusMessage = "Terhubung ke ${device.name ?: device.address}"
            successResult("Printer berhasil dihubungkan")
        } catch (error: IOException) {
            connectedSocket = null
            connectedDevice = null
            lastStatusMessage = "Gagal terhubung ke printer"
            errorResult("Gagal terhubung ke printer: ${error.message ?: "unknown error"}")
        }
    }

    fun getStatusJson(): String {
        val json = JSONObject()
            .put("connected", connectedSocket?.isConnected == true)
            .put("message", lastStatusMessage)

        connectedDevice?.let { device ->
            json.put("printerName", device.name ?: "Printer Tanpa Nama")
            json.put("printerAddress", device.address)
        }

        return json.toString()
    }

    fun printReceipt(payloadJson: String): String {
        val socket = connectedSocket
        if (socket == null || socket.isConnected != true) {
            lastStatusMessage = "Printer belum terhubung"
            return errorResult("Printer belum terhubung")
        }

        return try {
            val payload = JSONObject(payloadJson)
            val bytes = buildReceiptBytes(payload)
            socket.outputStream.write(bytes)
            socket.outputStream.flush()
            lastStatusMessage = "Perintah cetak berhasil dikirim"
            successResult("Perintah cetak berhasil dikirim")
        } catch (error: Exception) {
            lastStatusMessage = "Gagal mencetak struk"
            connectedSocket?.closeQuietly()
            connectedSocket = null
            connectedDevice = null
            errorResult("Gagal mencetak struk: ${error.message ?: "unknown error"}")
        }
    }

    private fun buildReceiptBytes(payload: JSONObject): ByteArray {
        val output = ByteArrayOutputStream()
        val merchant = payload.getJSONObject("merchant")
        val customer = payload.getJSONObject("customer")
        val payment = payload.getJSONObject("payment")
        val invoice = payload.getJSONObject("invoice")
        val summaryLines = payload.getJSONArray("summaryLines")
        val footerLines = payload.getJSONArray("footerLines")

        output.write(byteArrayOf(0x1B, 0x40))
        output.write(byteArrayOf(0x1B, 0x61, 0x01))
        output.write(byteArrayOf(0x1B, 0x45, 0x01))
        appendLine(output, merchant.getString("name"))
        output.write(byteArrayOf(0x1B, 0x45, 0x00))

        if (merchant.has("subtitle")) {
            appendLine(output, merchant.getString("subtitle"))
        }
        val addressLines = merchant.getJSONArray("addressLines")
        for (index in 0 until addressLines.length()) {
            appendLine(output, addressLines.getString(index))
        }
        appendLine(output, "STRUK PEMBAYARAN")
        appendLine(output, "No. Struk: ${payload.getString("receiptNumber")}")
        appendLine(output, if (payload.getString("settlementType") == "partial") "Pembayaran Parsial" else "Pelunasan Tagihan")
        appendDivider(output)

        output.write(byteArrayOf(0x1B, 0x61, 0x00))
        appendLine(output, "Pelanggan")
        appendKeyValue(output, "Nama", customer.optString("name"))
        appendOptionalKeyValue(output, "Alamat", customer.optString("address"))
        appendOptionalKeyValue(output, "Telepon", customer.optString("phone"))
        appendOptionalKeyValue(output, "No. Meter", customer.optString("meterNumber"))
        appendDivider(output)

        appendLine(output, "Pembayaran")
        appendKeyValue(output, "Tanggal", payment.optString("date"))
        appendKeyValue(output, "Metode", payment.optString("method"))
        appendOptionalKeyValue(output, "Referensi", payment.optString("referenceNumber"))
        appendKeyValue(output, "Nominal", payment.optString("amount"))
        appendDivider(output)

        appendLine(output, "Tagihan")
        appendKeyValue(output, "No. Tagihan", invoice.optString("invoiceNumber"))
        appendKeyValue(output, "Tanggal", invoice.optString("invoiceDate"))
        appendOptionalKeyValue(output, "Jatuh Tempo", invoice.optString("dueDate"))
        appendKeyValue(output, "Total Saat Bayar", invoice.optString("totalAmount"))
        appendDivider(output)

        appendLine(output, "Ringkasan")
        for (index in 0 until summaryLines.length()) {
            val item = summaryLines.getJSONObject(index)
            appendKeyValue(output, item.optString("label"), item.optString("value"))
        }
        appendDivider(output)

        for (index in 0 until footerLines.length()) {
            appendLine(output, footerLines.getString(index))
        }

        output.write(byteArrayOf(0x1B, 0x64, 0x04))
        return output.toByteArray()
    }

    private fun appendOptionalKeyValue(output: ByteArrayOutputStream, label: String, value: String?) {
        if (!value.isNullOrBlank()) {
            appendKeyValue(output, label, value)
        }
    }

    private fun appendKeyValue(output: ByteArrayOutputStream, label: String, value: String) {
        val line = padColumns(label, value, 32)
        appendLine(output, line)
    }

    private fun appendDivider(output: ByteArrayOutputStream) {
        appendLine(output, "--------------------------------")
    }

    private fun appendLine(output: ByteArrayOutputStream, text: String) {
        output.write(text.toByteArray(StandardCharsets.US_ASCII))
        output.write('\n'.code)
    }

    private fun padColumns(left: String, right: String, width: Int): String {
        val safeLeft = left.take(width)
        val safeRight = right.take(width)
        val padding = (width - safeLeft.length - safeRight.length).coerceAtLeast(1)
        return safeLeft + " ".repeat(padding) + safeRight
    }

    private fun hasBluetoothPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true
        }

        val connectGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.BLUETOOTH_CONNECT,
        ) == PackageManager.PERMISSION_GRANTED
        val scanGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.BLUETOOTH_SCAN,
        ) == PackageManager.PERMISSION_GRANTED
        return connectGranted && scanGranted
    }

    private fun successResult(message: String): String =
        JSONObject()
            .put("success", true)
            .put("message", message)
            .put("status", JSONObject(getStatusJson()))
            .toString()

    private fun errorResult(message: String): String =
        JSONObject()
            .put("success", false)
            .put("message", message)
            .put("status", JSONObject(getStatusJson()))
            .toString()

    private fun BluetoothSocket.closeQuietly() {
        try {
            close()
        } catch (_: IOException) {
        }
    }
}
