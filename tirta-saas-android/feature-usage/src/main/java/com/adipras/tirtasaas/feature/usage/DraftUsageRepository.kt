package com.adipras.tirtasaas.feature.usage

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import com.adipras.tirtasaas.core.database.dao.DraftUsageDao
import com.adipras.tirtasaas.core.database.entity.DraftUsageEntity

class DraftUsageRepository(
    private val dao: DraftUsageDao,
    private val api: UsageApiService // assume this exists in network module
) {
    suspend fun saveDraft(draft: DraftUsageEntity) = withContext(Dispatchers.IO) {
        dao.upsert(draft)
    }

    suspend fun getDrafts(): List<DraftUsageEntity> = withContext(Dispatchers.IO) {
        dao.getPendingDrafts()
    }

    // Sync one draft to server. Returns true if succeeded
    suspend fun syncOne(draftId: String): Boolean = withContext(Dispatchers.IO) {
        val pending = dao.getPendingDrafts()
        val draft = pending.firstOrNull { it.id == draftId } ?: return@withContext false
        try {
            val req = draft.toRequest()
            val resp = api.createWaterUsage(req)
            if (resp.isSuccessful) {
                // mark as synced
                dao.markSynced(draftId)
                return@withContext true
            }
        } catch (e: Exception) {
            // log
        }
        return@withContext false
    }

    private fun DraftUsageEntity.toRequest(): CreateWaterUsageRequest {
        // usageMonth expected like "YYYY-MM" in core entity
        val parts = this.usageMonth.split("-")
        val year = parts.getOrNull(0)?.toIntOrNull() ?: 0
        val month = parts.getOrNull(1)?.toIntOrNull() ?: 0
        return CreateWaterUsageRequest(
            id = this.id,
            customer_id = this.customerId,
            year = year,
            month = month,
            meter_start = 0,
            meter_end = this.meterEnd.toInt(),
            is_draft = true
        )
    }
}

// Placeholder data class for request - to be replaced with real DTO
data class CreateWaterUsageRequest(
    val id: String,
    val customer_id: String,
    val year: Int,
    val month: Int,
    val meter_start: Int,
    val meter_end: Int,
    val is_draft: Boolean
)
