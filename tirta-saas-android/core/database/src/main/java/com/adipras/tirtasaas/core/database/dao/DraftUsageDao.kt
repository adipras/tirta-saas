package com.adipras.tirtasaas.core.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.adipras.tirtasaas.core.database.entity.DraftUsageEntity

@Dao
interface DraftUsageDao {
    @Query("SELECT * FROM draft_usages WHERE is_synced = 0 ORDER BY created_at ASC")
    suspend fun getPendingDrafts(): List<DraftUsageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(draft: DraftUsageEntity)

    @Query("UPDATE draft_usages SET is_synced = 1 WHERE id = :id")
    suspend fun markSynced(id: String)

    @Query("DELETE FROM draft_usages WHERE id = :id")
    suspend fun deleteById(id: String)
}
