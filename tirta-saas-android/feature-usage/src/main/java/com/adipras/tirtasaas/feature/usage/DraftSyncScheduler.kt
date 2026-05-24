package com.adipras.tirtasaas.feature.usage

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import java.util.concurrent.TimeUnit

object DraftSyncScheduler {
    fun enqueue(
        context: Context,
        draftId: String,
        policy: ExistingWorkPolicy = ExistingWorkPolicy.REPLACE,
    ) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val request = OneTimeWorkRequestBuilder<DraftUsageSyncWorker>()
            .setInputData(workDataOf("draft_id" to draftId))
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "draft-sync-$draftId",
            policy,
            request,
        )
    }
}
