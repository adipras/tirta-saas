package com.adipras.tirtasaas.feature.usage

import com.adipras.tirtasaas.core.database.dao.DraftUsageDao
import com.adipras.tirtasaas.core.database.entity.DraftUsageEntity
import com.adipras.tirtasaas.core.network.requireData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DraftUsageRepository @Inject constructor(
    private val dao: DraftUsageDao,
    private val api: UsageApiService,
) {
    suspend fun saveDraft(draft: DraftUsageEntity) = withContext(Dispatchers.IO) {
        dao.upsert(draft)
    }

    suspend fun getDrafts(): List<DraftUsageEntity> = withContext(Dispatchers.IO) {
        dao.getPendingDrafts()
    }

    suspend fun getPendingDraftIds(): List<String> = withContext(Dispatchers.IO) {
        dao.getPendingDrafts().map { it.id }
    }

    /** Sync one pending draft to the server. Returns true if succeeded. */
    suspend fun syncOne(draftId: String): Boolean = withContext(Dispatchers.IO) {
        val draft = dao.getPendingDrafts().firstOrNull { it.id == draftId }
            ?: return@withContext true
        try {
            api.createWaterUsage(draft.toRequest()).requireData("Sinkronisasi draft gagal")
            dao.markSynced(draftId)
            return@withContext true
        } catch (e: Exception) {
            // retry handled by WorkManager
        }
        return@withContext false
    }

    private fun DraftUsageEntity.toRequest() = CreateWaterUsageRequest(
        id = this.id,
        customerId = this.customerId,
        usageMonth = this.usageMonth,
        meterEnd = this.meterEnd,
        notes = this.notes,
        isDraft = true,
    )
}
