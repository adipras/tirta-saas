package com.adipras.tirtasaas.feature.printer

import com.adipras.tirtasaas.feature.invoice.ReceiptPayloadDto
import java.nio.charset.Charset
import javax.inject.Inject

/**
 * Renders a ReceiptPayloadDto to ESC/POS byte array for 58mm thermal printers (32 chars wide).
 */
class EscPosRenderer @Inject constructor() {

    private val charset = Charset.forName("ISO-8859-1")
    private val lineWidth = 32

    private val ESC = 0x1B.toByte()
    private val GS = 0x1D.toByte()
    private val LF = 0x0A.toByte()
    private val INIT = byteArrayOf(ESC, 0x40.toByte())
    private val ALIGN_LEFT = byteArrayOf(ESC, 0x61.toByte(), 0x00.toByte())
    private val ALIGN_CENTER = byteArrayOf(ESC, 0x61.toByte(), 0x01.toByte())
    private val BOLD_ON = byteArrayOf(ESC, 0x45.toByte(), 0x01.toByte())
    private val BOLD_OFF = byteArrayOf(ESC, 0x45.toByte(), 0x00.toByte())
    private val CUT = byteArrayOf(GS, 0x56.toByte(), 0x41.toByte(), 0x10.toByte())

    private operator fun ByteArray.plus(other: ByteArray): ByteArray {
        val result = ByteArray(size + other.size)
        copyInto(result)
        other.copyInto(result, size)
        return result
    }

    private fun text(value: String): ByteArray = value.toByteArray(charset)
    private fun line(value: String = ""): ByteArray = text(value) + byteArrayOf(LF)
    private fun separator(): ByteArray = line("-".repeat(lineWidth))

    private fun formatTwoCol(left: String, right: String): ByteArray {
        val available = lineWidth - right.length
        val leftText = if (left.length > available) left.take(available) else left
        val spaces = (lineWidth - leftText.length - right.length).coerceAtLeast(1)
        return line(leftText + " ".repeat(spaces) + right)
    }

    fun render(receipt: ReceiptPayloadDto): ByteArray {
        var out = INIT + ALIGN_CENTER

        out += BOLD_ON + line(receipt.companyName.ifBlank { "Tirta SaaS" }) + BOLD_OFF
        if (receipt.companyPhone.isNotBlank()) out += line(receipt.companyPhone)
        if (receipt.companyEmail.isNotBlank()) out += line(receipt.companyEmail)
        out += separator()

        out += ALIGN_LEFT
        out += line("No: ${receipt.invoiceNumber}")
        out += line("Pelanggan: ${receipt.customerName}")
        out += line("Meter: ${receipt.meterNumber}")
        if (receipt.address.isNotBlank()) out += line("Alamat: ${receipt.address}")
        out += line("Bulan: ${receipt.usageMonth}")
        receipt.dueDate?.takeIf { it.isNotBlank() }?.let { out += line("Jatuh Tempo: $it") }
        out += separator()

        out += formatTwoCol("Meter Awal", formatNumber(receipt.meterStart) + " m3")
        out += formatTwoCol("Meter Akhir", formatNumber(receipt.meterEnd) + " m3")
        out += formatTwoCol("Pemakaian", formatNumber(receipt.usageM3) + " m3")
        out += separator()

        out += formatTwoCol("Biaya Air", formatRupiah(receipt.waterCharge))
        out += formatTwoCol("Abonemen", formatRupiah(receipt.abonemen))
        if (receipt.penaltyAmount > 0.0) {
            out += formatTwoCol("Denda", formatRupiah(receipt.penaltyAmount))
        }
        out += BOLD_ON + formatTwoCol("TOTAL", formatRupiah(receipt.totalAmount)) + BOLD_OFF
        out += formatTwoCol("Bayar", formatRupiah(receipt.totalPaid))
        val remainingAmount = (receipt.totalAmount - receipt.totalPaid).coerceAtLeast(0.0)
        if (remainingAmount > 0.0) {
            out += formatTwoCol("Sisa", formatRupiah(remainingAmount))
        }
        out += separator()

        out += ALIGN_CENTER
        if (receipt.footerText.isNotBlank()) {
            out += line(receipt.footerText)
        } else {
            out += line("Terima kasih!")
        }
        out += line()
        out += line()
        out += line()
        out += CUT
        return out
    }

    private fun formatRupiah(amount: Double): String {
        val long = amount.toLong()
        val formatted = StringBuilder()
        val stringValue = long.toString()
        var count = 0
        for (index in stringValue.indices.reversed()) {
            if (count > 0 && count % 3 == 0) formatted.insert(0, '.')
            formatted.insert(0, stringValue[index])
            count++
        }
        return "Rp$formatted"
    }

    private fun formatNumber(amount: Double): String {
        val asLong = amount.toLong()
        return if (amount == asLong.toDouble()) asLong.toString() else amount.toString()
    }
}
