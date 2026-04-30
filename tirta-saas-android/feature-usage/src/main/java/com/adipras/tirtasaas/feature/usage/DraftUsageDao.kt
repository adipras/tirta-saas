package com.adipras.tirtasaas.feature.usage

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update

@Dao
interface DraftUsageDao {
    @Insert
    suspend fun insert(draft: DraftUsageEntity)

    @Update
    suspend fun update(draft: DraftUsageEntity)

    @Query("SELECT * FROM draft_usages WHERE isDraft = 1")
    suspend fun getAllDrafts(): List<DraftUsageEntity>

    @Query("SELECT * FROM draft_usages WHERE id = :id LIMIT 1")
    suspend fun findById(id: String): DraftUsageEntity?

    @Query("DELETE FROM draft_usages WHERE id = :id")
    suspend fun deleteById(id: String)
}
