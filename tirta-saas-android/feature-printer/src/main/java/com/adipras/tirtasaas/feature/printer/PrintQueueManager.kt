package com.adipras.tirtasaas.feature.printer

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

private const val MAX_RETRIES = 3

@Singleton
class PrintQueueManager @Inject constructor(
    private val printerManager: BluetoothPrinterManager,
) {
    private val _queue = MutableStateFlow<List<PrintJob>>(emptyList())
    val queue: StateFlow<List<PrintJob>> = _queue.asStateFlow()

    fun enqueue(invoiceId: String, bytes: ByteArray): String {
        val job = PrintJob(id = UUID.randomUUID().toString(), invoiceId = invoiceId, bytes = bytes)
        _queue.value = _queue.value + job
        return job.id
    }

    suspend fun processNext(): PrintJobStatus {
        val job = _queue.value.firstOrNull { it.status == PrintJobStatus.PENDING }
            ?: return PrintJobStatus.SUCCESS
        updateStatus(job.id, PrintJobStatus.PRINTING)
        return if (printerManager.print(job.bytes).isSuccess) {
            _queue.value = _queue.value.filterNot { it.id == job.id }
            PrintJobStatus.SUCCESS
        } else {
            if (job.retryCount < MAX_RETRIES) {
                replaceJob(job.copy(retryCount = job.retryCount + 1, status = PrintJobStatus.PENDING))
                PrintJobStatus.PENDING
            } else {
                updateStatus(job.id, PrintJobStatus.FAILED)
                PrintJobStatus.FAILED
            }
        }
    }

    fun clearFailed() {
        _queue.value = _queue.value.filterNot { it.status == PrintJobStatus.FAILED }
    }

    private fun updateStatus(id: String, status: PrintJobStatus) {
        _queue.value = _queue.value.map { if (it.id == id) it.copy(status = status) else it }
    }

    private fun replaceJob(job: PrintJob) {
        _queue.value = _queue.value.map { if (it.id == job.id) job else it }
    }
}
