package com.adipras.tirtasaas.feature.usage

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class DraftUsageSyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val repository: DraftUsageRepository,
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val draftId = inputData.getString("draft_id") ?: return Result.failure()
        return try {
            val ok = repository.syncOne(draftId)
            if (ok) {
                DraftSyncNotifier.notifySuccess(applicationContext, draftId)
                Result.success(workDataOf("draft_id" to draftId))
            } else if (runAttemptCount >= 3) {
                DraftSyncNotifier.notifyFailure(applicationContext, draftId)
                Result.failure(workDataOf("draft_id" to draftId))
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            if (runAttemptCount >= 3) {
                DraftSyncNotifier.notifyFailure(applicationContext, draftId)
                Result.failure(workDataOf("draft_id" to draftId))
            } else {
                Result.retry()
            }
        }
    }
}
