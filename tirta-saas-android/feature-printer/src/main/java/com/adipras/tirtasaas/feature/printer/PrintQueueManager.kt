package com.adipras.tirtasaas.feature.printer

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PrintQueueManager @Inject constructor(
    private val printerManager: BluetoothPrinterManager
) {
    companion object {
        private const val TAG = "PrintQueueManager"
        private const val MAX_RETRIES = 3
    }

    private val queue = ArrayDeque<PrintJob>()
    private val mutex = Mutex()
    private var isProcessing = false

    suspend fun enqueue(job: PrintJob) = mutex.withLock {
        queue.addLast(job)
        Timber.tag(TAG).d("Enqueued job ${job.id} for invoice ${job.invoiceId}. Queue size: ${queue.size}")
    }

    suspend fun processNext(): Result<Unit> {
        val job = mutex.withLock {
            if (isProcessing || queue.isEmpty()) return Result.success(Unit)
            isProcessing = true
            queue.removeFirst()
        }

        Timber.tag(TAG).d("Processing job ${job.id}, attempt ${job.retryCount + 1}")
        val result = printerManager.print(job.bytes)

        return mutex.withLock {
            isProcessing = false
            if (result.isFailure) {
                val updatedJob = job.copy(
                    retryCount = job.retryCount + 1,
                    status = if (job.retryCount + 1 >= MAX_RETRIES) {
                        PrintJobStatus.FAILED
                    } else {
                        PrintJobStatus.PENDING
                    }
                )
                if (updatedJob.status == PrintJobStatus.PENDING) {
                    queue.addFirst(updatedJob)
                    Timber.tag(TAG).w(
                        "Job ${job.id} failed, will retry (${updatedJob.retryCount}/$MAX_RETRIES)"
                    )
                } else {
                    Timber.tag(TAG).e(
                        "Job ${job.id} permanently failed after $MAX_RETRIES attempts"
                    )
                }
                result
            } else {
                Timber.tag(TAG).d("Job ${job.id} succeeded")
                Result.success(Unit)
            }
        }
    }

    suspend fun clearQueue() = mutex.withLock { queue.clear() }
}
