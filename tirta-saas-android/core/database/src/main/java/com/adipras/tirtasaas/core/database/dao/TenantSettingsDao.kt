package com.adipras.tirtasaas.core.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.adipras.tirtasaas.core.database.entity.TenantSettingsEntity

@Dao
interface TenantSettingsDao {
    @Query("SELECT * FROM tenant_settings WHERE tenant_id = :tenantId LIMIT 1")
    suspend fun getSettings(tenantId: String): TenantSettingsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(settings: TenantSettingsEntity)

    @Query("DELETE FROM tenant_settings WHERE tenant_id = :tenantId")
    suspend fun deleteByTenantId(tenantId: String)
}
