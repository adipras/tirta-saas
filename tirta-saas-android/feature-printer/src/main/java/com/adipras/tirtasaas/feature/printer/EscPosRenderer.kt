package com.adipras.tirtasaas.feature.printer

import com.adipras.tirtasaas.feature.invoice.ReceiptPayloadDto
import javax.inject.Inject

private const val PAPER_WIDTH = 32

class EscPosRenderer @Inject constructor() {

    fun render(receipt: ReceiptPayloadDto): ByteArray {
        val sb = StringBuilder()

        fun center(text: String): String {
            if (text.length >= PAPER_WIDTH) return text.take(PAPER_WIDTH)
            val totalPad = PAPER_WIDTH - text.length
            val left = totalPad / 2
            return " ".repeat(left) + text + " ".repeat(totalPad - left)
        }

        fun line(label: String, value: String): String {
            val space = PAPER_WIDTH - label.length - value.length
            return if (space > 0) label + " ".repeat(space) + value else "$label $value"
        }

        fun divider() = "-".repeat(PAPER_WIDTH)

        sb.append(center(receipt.companyName)).append("\n")
        if (receipt.companyPhone.isNotBlank()) sb.append(center(receipt.companyPhone)).append("\n")
        sb.append(divider()).append("\n")
        sb.append(line("No. Tagihan:", receipt.invoiceNumber.takeLast(16))).append("\n")
        sb.append(line("Pelanggan:", receipt.customerName.take(18))).append("\n")
        sb.append(line("No. Meter:", receipt.meterNumber.take(18))).append("\n")
        sb.append(line("Bulan:", receipt.usageMonth)).append("\n")
        sb.append(divider()).append("\n")
        sb.append(line("Meter Awal:", "${receipt.meterStart} m3")).append("\n")
        sb.append(line("Meter Akhir:", "${receipt.meterEnd} m3")).append("\n")
        sb.append(line("Pemakaian:", "${receipt.usageM3} m3")).append("\n")
        sb.append(divider()).append("\n")
        sb.append(line("Biaya Air:", formatRp(receipt.waterCharge))).append("\n")
        sb.append(line("Abonemen:", formatRp(receipt.abonemen))).append("\n")
        if (receipt.penaltyAmount > 0) sb.append(line("Denda:", formatRp(receipt.penaltyAmount))).append("\n")
        sb.append(divider()).append("\n")
        sb.append(line("TOTAL:", formatRp(receipt.totalAmount))).append("\n")
        if (receipt.totalPaid > 0) sb.append(line("Dibayar:", formatRp(receipt.totalPaid))).append("\n")
        val dueDate = receipt.dueDate
        if (!dueDate.isNullOrBlank()) sb.append(line("Jatuh Tempo:", dueDate)).append("\n")
        if (receipt.footerText.isNotBlank()) {
            sb.append(divider()).append("\n")
            sb.append(center(receipt.footerText)).append("\n")
        }
        sb.append("\n\n\n")

        val init = byteArrayOf(0x1B, 0x40)
        val cut  = byteArrayOf(0x1D, 0x56, 0x41, 0x03)
        val text = sb.toString().toByteArray(Charsets.ISO_8859_1)
        return init + text + cut
    }

    private fun formatRp(amount: Double) = "Rp${String.format("%,.0f", amount)}"
}

private operator fun ByteArray.plus(other: ByteArray): ByteArray {
    val result = ByteArray(size + other.size)
    copyInto(result)
    other.copyInto(result, size)
    return result
}
