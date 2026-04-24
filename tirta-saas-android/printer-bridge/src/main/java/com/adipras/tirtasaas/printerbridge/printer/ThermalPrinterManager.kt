package com.adipras.tirtasaas.printerbridge.printer

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Build
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.Charset
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.UUID

class ThermalPrinterManager(
    context: Context,
) {
    private val appContext = context.applicationContext
    private val preferences = appContext.getSharedPreferences("printer_bridge", Context.MODE_PRIVATE)
    private val bluetoothAdapter: BluetoothAdapter? =
        appContext.getSystemService(BluetoothManager::class.java)?.adapter
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

        // Extended fields (new layout)
        val invoiceStatus = payload.optString("invoiceStatus")
        val settlementType = payload.optString("settlementType")
        val printedAt = payload.optString("printedAt").ifBlank { null }
        val footerText = payload.optString("footerText").ifBlank { null }
        val logoUrl = payload.optString("logoUrl").ifBlank { null }
        val qrisImageUrl = payload.optString("qrisImageUrl").ifBlank { null }
        val usageDetails = payload.optJSONObject("usageDetails")
        val bankInfo = payload.optJSONObject("bankInfo")
        val printNotes = payload.optString("printNotes").ifBlank { null }

        appendInitialize(output)

        // === HEADER ===
        appendAlign(output, "center")
        if (!logoUrl.isNullOrBlank()) {
            appendOptionalRemoteImage(output, logoUrl, "Logo tidak dapat dimuat", LOGO_MAX_WIDTH_DOTS)
        }
        appendBold(output, true)
        appendWrappedText(output, merchant.getString("name").uppercase(Locale("id", "ID")))
        appendBold(output, false)
        val addressLines = merchant.optJSONArray("addressLines")
        if (addressLines != null) {
            for (index in 0 until addressLines.length()) {
                appendWrappedText(output, addressLines.getString(index))
            }
        }
        appendDivider(output)

        // === INFO STRUK + PELANGGAN ===
        appendAlign(output, "left")

        val statusLabel = when (invoiceStatus) {
            "paid" -> "Lunas"
            "partial" -> "Parsial"
            "unpaid" -> "Belum Lunas"
            else -> if (settlementType == "full") "Lunas" else "Parsial"
        }
        appendKeyValue(output, "No. ${payload.optString("receiptNumber")}", statusLabel)

        val rawDate = payment.optString("date")
        val formattedDate = formatIsoDate(rawDate)
        appendLine(output, formattedDate)

        appendKeyValue(output, "Pelanggan", customer.optString("name"))

        val meterNumber = customer.optString("meterNumber")
        if (meterNumber.isNotBlank()) appendKeyValue(output, "No. Meter", meterNumber)

        val address = customer.optString("address")
        if (address.isNotBlank()) appendWrappedText(output, address)

        appendKeyValue(output, "No. Tagihan", invoice.optString("invoiceNumber"))
        appendKeyValue(output, "Metode", payment.optString("method"))

        val refNumber = payment.optString("referenceNumber")
        if (refNumber.isNotBlank()) appendKeyValue(output, "Ref.", refNumber)

        appendDivider(output)

        // === ITEM TAGIHAN ===
        val month = usageDetails?.optString("month")?.ifBlank { null }
        val usageM3 = usageDetails?.optDouble("usageM3", 0.0) ?: 0.0
        val shouldShowWaterBillSection = usageM3 > 0
        if (shouldShowWaterBillSection) {
            val itemLabel = if (month != null) "Tagihan Air - $month" else "Tagihan Air"
            appendBold(output, true)
            appendLine(output, itemLabel)
            appendBold(output, false)

            if (usageDetails != null) {
                val subTotal = usageDetails.optDouble("subTotal", 0.0)
                val m3Label = usageM3.toBigDecimal().stripTrailingZeros().toPlainString()
                appendKeyValue(output, "$m3Label m3", formatCurrencyKt(subTotal))
            }
            appendDivider(output)
        }

        // === RINGKASAN BIAYA ===
        for (index in 0 until summaryLines.length()) {
            val item = summaryLines.getJSONObject(index)
            val label = item.optString("label")
            val value = item.optString("value")
            val emphasis = item.optString("emphasis")
            if (emphasis == "strong" || emphasis == "warning" || emphasis == "success") {
                appendBold(output, true)
                appendKeyValue(output, label, value)
                appendBold(output, false)
            } else {
                appendKeyValue(output, label, value)
            }
        }
        appendDivider(output)

        // === REKENING BANK + QRIS (optional) ===
        if (bankInfo != null || !qrisImageUrl.isNullOrBlank()) {
            appendAlign(output, "center")
        }
        if (bankInfo != null) {
            val bankName = bankInfo.optString("bankName")
            val bankAccountNo = bankInfo.optString("bankAccountNo")
            val bankAccountName = bankInfo.optString("bankAccountName")
            if (bankName.isNotBlank() && bankAccountNo.isNotBlank()) {
                appendWrappedText(output, "$bankName - $bankAccountNo")
            }
            if (bankAccountName.isNotBlank()) appendWrappedText(output, "a.n. $bankAccountName")
        }
        if (!qrisImageUrl.isNullOrBlank()) {
            if (bankInfo != null) {
                appendFeed(output, 1)
            }
            appendOptionalRemoteImage(output, qrisImageUrl, "QRIS tidak dapat dimuat", QRIS_MAX_WIDTH_DOTS)
        }
        if (bankInfo != null || !qrisImageUrl.isNullOrBlank()) {
            appendDivider(output)
        }

        // === FOOTER ===
        appendAlign(output, "center")
        if (!footerText.isNullOrBlank()) {
            appendWrappedText(output, footerText)
        }
        for (index in 0 until footerLines.length()) {
            val footerLine = footerLines.getString(index)
            if (
                footerLine.startsWith("Dicetak:", ignoreCase = true) ||
                footerLine.equals("Masih ada sisa tagihan.", ignoreCase = true) ||
                footerLine.equals("Tagihan lunas.", ignoreCase = true)
            ) {
                continue
            }
            appendLine(output, footerLine)
        }
        if (settlementType == "partial") {
            appendLine(output, "Masih ada sisa tagihan.")
        }
        if (!printNotes.isNullOrBlank()) {
            appendWrappedText(output, printNotes)
        }
        if (printedAt != null) {
            appendLine(output, "Dicetak: ${formatIsoDate(printedAt)}")
        }

        appendFeed(output, 3)
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
        val normalizedLabel = label.replace("\\s+".toRegex(), " ").trim()
        val normalizedValue = value.replace("\\s+".toRegex(), " ").trim()
        if (normalizedLabel.isBlank()) {
            appendWrappedText(output, normalizedValue)
            return
        }
        if (normalizedValue.isBlank()) {
            appendWrappedText(output, normalizedLabel)
            return
        }

        if (normalizedLabel.length + normalizedValue.length + 1 <= LINE_WIDTH) {
            appendLine(output, padColumns(normalizedLabel, normalizedValue, LINE_WIDTH))
            return
        }

        appendWrappedText(output, normalizedLabel)
        wrapText(normalizedValue, LINE_WIDTH).forEach { appendLine(output, it.padStart(LINE_WIDTH)) }
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

    private fun appendWrappedText(output: ByteArrayOutputStream, text: String) {
        wrapText(text, LINE_WIDTH).forEach { appendLine(output, it) }
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

    private fun appendOptionalRemoteImage(
        output: ByteArrayOutputStream,
        imageUrl: String,
        fallbackMessage: String,
        maxWidthDots: Int,
    ) {
        try {
            val bitmap = fetchBitmap(imageUrl)
            appendBitmap(output, bitmap, maxWidthDots)
            appendFeed(output, 1)
        } catch (_: IOException) {
            appendLine(output, fallbackMessage)
        } catch (_: IllegalArgumentException) {
            appendLine(output, fallbackMessage)
        }
    }

    private fun fetchBitmap(imageUrl: String): Bitmap {
        val connection = (URL(imageUrl).openConnection() as HttpURLConnection).apply {
            connectTimeout = IMAGE_FETCH_TIMEOUT_MS
            readTimeout = IMAGE_FETCH_TIMEOUT_MS
            requestMethod = "GET"
            instanceFollowRedirects = true
            doInput = true
        }

        try {
            connection.connect()
            if (connection.responseCode !in 200..299) {
                throw IOException("HTTP ${connection.responseCode}")
            }

            connection.inputStream.use { stream ->
                return BitmapFactory.decodeStream(stream)
                    ?: throw IOException("Gagal membaca gambar")
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun appendBitmap(output: ByteArrayOutputStream, bitmap: Bitmap, maxWidthDots: Int) {
        val scaledBitmap = scaleBitmap(bitmap, maxWidthDots)
        val width = scaledBitmap.width
        val height = scaledBitmap.height
        val widthBytes = (width + 7) / 8
        val imageBytes = ByteArray(widthBytes * height)

        var offset = 0
        for (y in 0 until height) {
            for (xByte in 0 until widthBytes) {
                var value = 0
                for (bit in 0 until 8) {
                    val x = xByte * 8 + bit
                    if (x >= width) {
                        continue
                    }

                    val pixel = scaledBitmap.getPixel(x, y)
                    val alpha = Color.alpha(pixel)
                    if (alpha < 128) {
                        continue
                    }

                    val luminance = (
                        (Color.red(pixel) * 0.299) +
                            (Color.green(pixel) * 0.587) +
                            (Color.blue(pixel) * 0.114)
                        ).toInt()

                    if (luminance < IMAGE_THRESHOLD) {
                        value = value or (1 shl (7 - bit))
                    }
                }
                imageBytes[offset++] = value.toByte()
            }
        }

        output.write(
            byteArrayOf(
                0x1D,
                0x76,
                0x30,
                0x00,
                (widthBytes and 0xFF).toByte(),
                ((widthBytes shr 8) and 0xFF).toByte(),
                (height and 0xFF).toByte(),
                ((height shr 8) and 0xFF).toByte(),
            ),
        )
        output.write(imageBytes)

        if (scaledBitmap != bitmap) {
            scaledBitmap.recycle()
        }
    }

    private fun scaleBitmap(bitmap: Bitmap, maxWidthDots: Int): Bitmap {
        if (bitmap.width <= maxWidthDots) {
            return bitmap
        }

        val aspectRatio = bitmap.height.toDouble() / bitmap.width.toDouble()
        val scaledHeight = (maxWidthDots * aspectRatio).toInt().coerceAtLeast(1)
        return Bitmap.createScaledBitmap(bitmap, maxWidthDots, scaledHeight, true)
    }

    private fun wrapText(text: String, width: Int): List<String> {
        val normalized = text.replace("\\s+".toRegex(), " ").trim()
        if (normalized.isBlank()) {
            return emptyList()
        }

        val lines = mutableListOf<String>()
        var current = ""

        normalized.split(" ").forEach { word ->
            if (word.length > width) {
                if (current.isNotBlank()) {
                    lines += current
                    current = ""
                }

                var startIndex = 0
                while (startIndex < word.length) {
                    val endIndex = (startIndex + width).coerceAtMost(word.length)
                    lines += word.substring(startIndex, endIndex)
                    startIndex = endIndex
                }
            } else if (current.isBlank()) {
                current = word
            } else if (current.length + 1 + word.length <= width) {
                current = "$current $word"
            } else {
                lines += current
                current = word
            }
        }

        if (current.isNotBlank()) {
            lines += current
        }

        return lines
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

    private fun formatIsoDate(isoString: String): String {
        if (isoString.isBlank()) return "-"
        return try {
            val inputFormats = listOf(
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.getDefault()),
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault()),
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()),
                SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()),
            )
            val date = inputFormats.firstNotNullOfOrNull { fmt ->
                try { fmt.parse(isoString) } catch (_: Exception) { null }
            }
            if (date != null) {
                SimpleDateFormat("dd/MM/yyyy HH:mm", Locale("id", "ID")).format(date)
            } else {
                isoString
            }
        } catch (_: Exception) {
            isoString
        }
    }

    private fun formatCurrencyKt(value: Double): String {
        val nf = NumberFormat.getNumberInstance(Locale("id", "ID"))
        nf.maximumFractionDigits = 0
        return "Rp ${nf.format(value.toLong())}"
    }

    private companion object {
        const val KEY_PREFERRED_PRINTER_ID = "preferred_printer_id"
        const val LINE_WIDTH = 32
        const val LOGO_MAX_WIDTH_DOTS = 192
        const val QRIS_MAX_WIDTH_DOTS = 192
        const val IMAGE_THRESHOLD = 180
        const val IMAGE_FETCH_TIMEOUT_MS = 5000
    }
}
