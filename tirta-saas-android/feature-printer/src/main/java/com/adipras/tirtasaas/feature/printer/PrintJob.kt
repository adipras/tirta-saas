package com.adipras.tirtasaas.feature.printer

data class PrintJob(
    val id: String,
    val invoiceId: String,
    val bytes: ByteArray,
    val retryCount: Int = 0,
    val status: PrintJobStatus = PrintJobStatus.PENDING,
) {
    override fun equals(other: Any?) = other is PrintJob && id == other.id
    override fun hashCode() = id.hashCode()
}

enum class PrintJobStatus { PENDING, PRINTING, SUCCESS, FAILED }
