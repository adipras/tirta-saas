package com.adipras.tirtasaas.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.adipras.tirtasaas.core.database.dao.SyncQueueDao
import com.adipras.tirtasaas.core.database.dao.TenantSettingsDao
import com.adipras.tirtasaas.core.database.entity.SyncQueueEntity
import com.adipras.tirtasaas.core.database.entity.TenantSettingsEntity
import com.adipras.tirtasaas.core.database.entity.DraftUsageEntity

@Database(
    entities = [SyncQueueEntity::class, TenantSettingsEntity::class, DraftUsageEntity::class],
    version = 3,
    exportSchema = false,
)
abstract class TirtaDatabase : RoomDatabase() {
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun tenantSettingsDao(): TenantSettingsDao
    abstract fun draftUsageDao(): com.adipras.tirtasaas.core.database.dao.DraftUsageDao
}
