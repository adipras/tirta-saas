package com.adipras.tirtasaas.printerbridge.printer

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
import java.nio.charset.Charset
import java.util.UUID

class ThermalPrinterManager(
    context: Context,
) {
    private val appContext = context.applicationContext
    private val preferences = appContext.getSharedPreferences("printer_bridge", Context.MODE_PRIVATE)
    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private val sppUuid: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private val printerCharset: Charset = Charset.forName("CP437")

    @Volatile
    private var connectedSocket: BluetoothSocket? = null

    @Volatile
    private var connectedDevice: BluetoothDevice? = null

    @Volatile
    private var lastStatusMessage: String = "Belum terhubung"

    @SuppressLint("MissingPermission")
    @Synchronized
    fun listPairedPrinters(): List<ThermalPrinterDevice> {
        if (bluetoothAdapter == null) {
            lastStatusMessage = "Bluetooth tidak tersedia pada perangkat ini"
            return emptyList()
        }
        if (!hasBluetoothPermission()) {
            lastStatusMessage = "Izin Bluetooth belum diberikan"
            return emptyList()
        }

        val devices = bluetoothAdapter.bondedDevices
            .map {
                ThermalPrinterDevice(
                    id = it.address,
                    name = it.name ?: "Printer Tanpa Nama",
                    address = it.address,
                )
            }
            .sortedBy { it.name.lowercase() }

        lastStatusMessage = if (devices.isEmpty()) {
            "Tidak ada printer Bluetooth yang sudah dipasangkan"
        } else {
            "${devices.size} printer siap dipilih"
        }
        return devices
    }

    @Synchronized
    fun setStatusMessage(message: String) {
        lastStatusMessage = message
    }

    @Synchronized
    fun connect(deviceId: String?): PrinterCommandResult {
        val targetId = deviceId?.takeIf { it.isNotBlank() } ?: getPreferredPrinterId()
        if (targetId.isNullOrBlank()) {
            lastStatusMessage = "Belum ada printer favorit yang tersimpan"
            return PrinterCommandResult(false, lastStatusMessage)
        }

        return connectInternal(targetId, rememberPrinter = true)
    }

    @Synchronized
    fun printReceipt(payloadJson: String): PrinterCommandResult {
        val payload = try {
            JSONObject(payloadJson)
        } catch (_: Exception) {
            lastStatusMessage = "Payload cetak tidak valid"
            return PrinterCommandResult(false, lastStatusMessage)
        }

        val printBytes = try {
            buildPrintJobBytes(payload)
        } catch (error: Exception) {
            lastStatusMessage = "Payload cetak tidak lengkap"
            return PrinterCommandResult(false, "Payload cetak tidak lengkap: ${error.message ?: "unknown error"}")
        }

        val activeSocket = ensureConnectedSocket()
            ?: return PrinterCommandResult(false, "Printer belum terhubung")

        return trySend(printBytes, activeSocket)
    }

    @Synchronized
    fun buildStatus(bridgeRunning: Boolean): PrinterBridgeStatus {
        val preferredPrinterId = getPreferredPrinterId()
        val preferredPrinter = findBondedDevice(preferredPrinterId)
        val activeDevice = connectedDevice

        return PrinterBridgeStatus(
            bridgeRunning = bridgeRunning,
            connected = connectedSocket?.isConnected == true,
            message = lastStatusMessage,
            printerName = activeDevice?.name,
            printerAddress = activeDevice?.address,
            preferredPrinterId = preferredPrinterId,
            preferredPrinterName = preferredPrinter?.name,
        )
    }

    @Synchronized
    fun shutdown() {
        closeCurrentConnection()
        lastStatusMessage = "Bridge printer berhenti"
    }

    @SuppressLint("MissingPermission")
    private fun connectInternal(deviceId: String, rememberPrinter: Boolean): PrinterCommandResult {
        if (bluetoothAdapter == null) {
            lastStatusMessage = "Bluetooth tidak tersedia pada perangkat ini"
            return PrinterCommandResult(false, lastStatusMessage)
        }
        if (!hasBluetoothPermission()) {
            lastStatusMessage = "Izin Bluetooth belum diberikan"
            return PrinterCommandResult(false, lastStatusMessage)
        }

        val device = bluetoothAdapter.bondedDevices.firstOrNull { it.address == deviceId }
            ?: run {
                lastStatusMessage = "Printer tidak ditemukan di daftar perangkat terpasang"
                return PrinterCommandResult(false, lastStatusMessage)
            }

        if (connectedSocket?.isConnected == true && connectedDevice?.address == deviceId) {
            lastStatusMessage = "Printer ${device.name ?: device.address} sudah terhubung"
            return PrinterCommandResult(true, lastStatusMessage)
        }

        return try {
            closeCurrentConnection()
            bluetoothAdapter.cancelDiscovery()

            val socket = device.createRfcommSocketToServiceRecord(sppUuid)
            socket.connect()

            connectedSocket = socket
            connectedDevice = device
            if (rememberPrinter) {
                preferences.edit().putString(KEY_PREFERRED_PRINTER_ID, device.address).apply()
            }
            lastStatusMessage = "Terhubung ke ${device.name ?: device.address}"
            PrinterCommandResult(true, lastStatusMessage)
        } catch (error: IOException) {
            closeCurrentConnection()
            lastStatusMessage = "Gagal terhubung ke printer"
            PrinterCommandResult(false, "Gagal terhubung ke printer: ${error.message ?: "unknown error"}")
        }
    }

    private fun ensureConnectedSocket(): BluetoothSocket? {
        val socket = connectedSocket
        if (socket?.isConnected == true) {
            return socket
        }

        val reconnectTarget = connectedDevice?.address ?: getPreferredPrinterId()
        if (reconnectTarget.isNullOrBlank()) {
            lastStatusMessage = "Printer belum terhubung"
            return null
        }

        val reconnectResult = connectInternal(reconnectTarget, rememberPrinter = false)
        if (!reconnectResult.success) {
            return null
        }

        return connectedSocket
    }

    private fun trySend(bytes: ByteArray, socket: BluetoothSocket): PrinterCommandResult {
        return try {
            socket.outputStream.write(bytes)
            socket.outputStream.flush()
            lastStatusMessage = "Perintah cetak berhasil dikirim"
            PrinterCommandResult(true, lastStatusMessage)
        } catch (error: IOException) {
            closeCurrentConnection()

            val reconnectTarget = getPreferredPrinterId()
            if (reconnectTarget.isNullOrBlank()) {
                lastStatusMessage = "Koneksi printer terputus"
                return PrinterCommandResult(false, "Koneksi printer terputus: ${error.message ?: "unknown error"}")
            }

            val reconnectResult = connectInternal(reconnectTarget, rememberPrinter = false)
            if (!reconnectResult.success) {
                return PrinterCommandResult(
                    false,
                    "Koneksi printer terputus dan sambung ulang gagal",
                )
            }

            return try {
                connectedSocket?.outputStream?.write(bytes)
                connectedSocket?.outputStream?.flush()
                lastStatusMessage = "Perintah cetak berhasil dikirim setelah sambung ulang"
                PrinterCommandResult(true, lastStatusMessage)
            } catch (retryError: IOException) {
                closeCurrentConnection()
                lastStatusMessage = "Gagal mencetak struk"
                PrinterCommandResult(false, "Gagal mencetak struk: ${retryError.message ?: "unknown error"}")
            }
        }
    }

    private fun buildPrintJobBytes(payload: JSONObject): ByteArray {
        val type = payload.optString("type")
        return when {
            type == "payment_receipt" || payload.has("merchant") -> buildPaymentReceiptBytes(payload)
            type == "receipt" -> {
                val content = payload.optJSONObject("content")
                    ?: throw IllegalArgumentException("content wajib diisi untuk type=receipt")
                buildGenericReceiptBytes(content)
            }

            payload.has("content") -> buildGenericReceiptBytes(
                payload.optJSONObject("content")
                    ?: throw IllegalArgumentException("content wajib berbentuk object"),
            )

            else -> throw IllegalArgumentException("type cetak tidak didukung")
        }
    }

    private fun buildPaymentReceiptBytes(payload: JSONObject): ByteArray {
        val output = ByteArrayOutputStream()
        val merchant = payload.getJSONObject("merchant")
        val customer = payload.getJSONObject("customer")
        val payment = payload.getJSONObject("payment")
        val invoice = payload.getJSONObject("invoice")
        val summaryLines = payload.getJSONArray("summaryLines")
        val footerLines = payload.getJSONArray("footerLines")

        appendInitialize(output)
        appendAlign(output, "center")
        appendBold(output, true)
        appendLine(output, merchant.getString("name"))
        appendBold(output, false)

        appendOptionalLine(output, merchant.optString("subtitle"))
        val addressLines = merchant.optJSONArray("addressLines")
        if (addressLines != null) {
            for (index in 0 until addressLines.length()) {
                appendLine(output, addressLines.getString(index))
            }
        }

        appendLine(output, "STRUK PEMBAYARAN")
        appendLine(output, "No. Struk: ${payload.optString("receiptNumber")}")
        appendLine(
            output,
            if (payload.optString("settlementType") == "partial") {
                "Pembayaran Parsial"
            } else {
                "Pelunasan Tagihan"
            },
        )
        appendDivider(output)

        appendAlign(output, "left")
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

        val qrData = payload.optString("qrData").ifBlank {
            payload.optJSONObject("payment")?.optString("referenceNumber").orEmpty()
        }
        if (qrData.isNotBlank()) {
            appendDivider(output)
            appendAlign(output, "center")
            appendLine(output, "Scan Referensi")
            appendQrCode(output, qrData)
            appendFeed(output, 1)
        }

        appendCut(output)
        return output.toByteArray()
    }

    private fun buildGenericReceiptBytes(content: JSONObject): ByteArray {
        val output = ByteArrayOutputStream()
        appendInitialize(output)

        val align = content.optString("align", "left")
        val bold = content.optBoolean("bold", false)
        val doubleSize = content.optBoolean("doubleSize", false)
        val text = content.optString("text")
        if (text.isNotBlank()) {
            appendAlign(output, align)
            appendBold(output, bold)
            appendTextSize(output, doubleSize)
            appendMultilineText(output, text)
            appendTextSize(output, false)
            appendBold(output, false)
            appendFeed(output, 1)
        }

        val items = content.optJSONArray("items")
        if (items != null && items.length() > 0) {
            appendAlign(output, "left")
            appendDivider(output)
            appendItems(output, items)
        }

        if (content.has("total")) {
            appendDivider(output)
            appendAlign(output, "right")
            appendBold(output, true)
            appendTextSize(output, true)
            appendLine(output, "TOTAL ${content.opt("total")}")
            appendTextSize(output, false)
            appendBold(output, false)
            appendFeed(output, 1)
        }

        val qrData = content.optString("qrData").ifBlank {
            content.optString("qr_code")
        }
        if (qrData.isNotBlank()) {
            appendAlign(output, "center")
            appendLine(output, content.optString("qrLabel", "Scan QR"))
            appendQrCode(output, qrData)
            appendFeed(output, 1)
        }

        val footerLines = content.optJSONArray("footerLines")
        if (footerLines != null) {
            appendAlign(output, "left")
            for (index in 0 until footerLines.length()) {
                appendLine(output, footerLines.optString(index))
            }
        }

        val lineFeed = content.optInt("lineFeed", 3).coerceIn(0, 8)
        appendFeed(output, lineFeed)

        if (content.optBoolean("cutPaper", true)) {
            appendCut(output)
        }
        return output.toByteArray()
    }

    private fun appendItems(output: ByteArrayOutputStream, items: JSONArray) {
        for (index in 0 until items.length()) {
            val item = items.opt(index)
            when (item) {
                is JSONObject -> {
                    val label = item.optString("label").ifBlank {
                        item.optString("name").ifBlank { "Item ${index + 1}" }
                    }
                    val value = item.opt("value")
                        ?: item.opt("amount")
                        ?: item.opt("price")
                        ?: item.opt("qty")
                    if (value != null) {
                        appendKeyValue(output, label, value.toString())
                    } else {
                        appendLine(output, label)
                    }
                }

                else -> appendLine(output, item?.toString().orEmpty())
            }
        }
    }

    private fun appendOptionalLine(output: ByteArrayOutputStream, text: String?) {
        if (!text.isNullOrBlank()) {
            appendLine(output, text)
        }
    }

    private fun appendOptionalKeyValue(output: ByteArrayOutputStream, label: String, value: String?) {
        if (!value.isNullOrBlank()) {
            appendKeyValue(output, label, value)
        }
    }

    private fun appendInitialize(output: ByteArrayOutputStream) {
        output.write(byteArrayOf(0x1B, 0x40))
    }

    private fun appendAlign(output: ByteArrayOutputStream, align: String) {
        val value = when (align.lowercase()) {
            "center" -> 0x01
            "right" -> 0x02
            else -> 0x00
        }
        output.write(byteArrayOf(0x1B, 0x61, value.toByte()))
    }

    private fun appendBold(output: ByteArrayOutputStream, enabled: Boolean) {
        output.write(byteArrayOf(0x1B, 0x45, if (enabled) 0x01 else 0x00))
    }

    private fun appendTextSize(output: ByteArrayOutputStream, doubleSize: Boolean) {
        output.write(byteArrayOf(0x1D, 0x21, if (doubleSize) 0x11 else 0x00))
    }

    private fun appendKeyValue(output: ByteArrayOutputStream, label: String, value: String) {
        appendLine(output, padColumns(label, value, LINE_WIDTH))
    }

    private fun appendDivider(output: ByteArrayOutputStream) {
        appendLine(output, "-".repeat(LINE_WIDTH))
    }

    private fun appendLine(output: ByteArrayOutputStream, text: String) {
        output.write(text.toByteArray(printerCharset))
        output.write('\n'.code)
    }

    private fun appendMultilineText(output: ByteArrayOutputStream, text: String) {
        text.lines().forEach { appendLine(output, it) }
    }

    private fun appendFeed(output: ByteArrayOutputStream, lines: Int) {
        output.write(byteArrayOf(0x1B, 0x64, lines.coerceAtLeast(0).toByte()))
    }

    private fun appendCut(output: ByteArrayOutputStream) {
        output.write(byteArrayOf(0x1D, 0x56, 0x00))
    }

    private fun appendQrCode(output: ByteArrayOutputStream, data: String) {
        val qrBytes = data.toByteArray(Charsets.UTF_8)
        val payloadLength = qrBytes.size + 3
        val pL = (payloadLength and 0xFF).toByte()
        val pH = ((payloadLength shr 8) and 0xFF).toByte()

        output.write(byteArrayOf(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00))
        output.write(byteArrayOf(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06))
        output.write(byteArrayOf(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30))
        output.write(byteArrayOf(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30))
        output.write(qrBytes)
        output.write(byteArrayOf(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30))
    }

    private fun padColumns(left: String, right: String, width: Int): String {
        val safeLeft = left.take(width)
        val safeRight = right.take(width)
        val padding = (width - safeLeft.length - safeRight.length).coerceAtLeast(1)
        return safeLeft + " ".repeat(padding) + safeRight
    }

    @SuppressLint("MissingPermission")
    private fun findBondedDevice(deviceId: String?): BluetoothDevice? {
        if (deviceId.isNullOrBlank() || bluetoothAdapter == null || !hasBluetoothPermission()) {
            return null
        }

        return bluetoothAdapter.bondedDevices.firstOrNull { it.address == deviceId }
    }

    private fun getPreferredPrinterId(): String? =
        preferences.getString(KEY_PREFERRED_PRINTER_ID, null)

    private fun hasBluetoothPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true
        }

        val connectGranted = ContextCompat.checkSelfPermission(
            appContext,
            Manifest.permission.BLUETOOTH_CONNECT,
        ) == PackageManager.PERMISSION_GRANTED
        val scanGranted = ContextCompat.checkSelfPermission(
            appContext,
            Manifest.permission.BLUETOOTH_SCAN,
        ) == PackageManager.PERMISSION_GRANTED
        return connectGranted && scanGranted
    }

    private fun closeCurrentConnection() {
        connectedSocket?.closeQuietly()
        connectedSocket = null
        connectedDevice = null
    }

    private fun BluetoothSocket.closeQuietly() {
        try {
            close()
        } catch (_: IOException) {
        }
    }

    private companion object {
        const val KEY_PREFERRED_PRINTER_ID = "preferred_printer_id"
        const val LINE_WIDTH = 32
    }
}
