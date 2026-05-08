package com.adipras.tirtasaas.feature.printer

import java.util.UUID

enum class PrintJobStatus {
    PENDING,
    PRINTING,
    SUCCESS,
    FAILED
}

data class PrintJob(
    val id: String = UUID.randomUUID().toString(),
    val invoiceId: String,
    val bytes: ByteArray,
    val status: PrintJobStatus = PrintJobStatus.PENDING,
    val retryCount: Int = 0
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PrintJob) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
