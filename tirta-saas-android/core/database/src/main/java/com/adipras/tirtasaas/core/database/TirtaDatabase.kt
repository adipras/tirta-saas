package com.adipras.tirtasaas.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.adipras.tirtasaas.core.database.dao.CustomerDao
import com.adipras.tirtasaas.core.database.dao.DraftUsageDao
import com.adipras.tirtasaas.core.database.dao.SyncQueueDao
import com.adipras.tirtasaas.core.database.dao.TenantSettingsDao
import com.adipras.tirtasaas.core.database.entity.CachedCustomerEntity
import com.adipras.tirtasaas.core.database.entity.CachedMeterEntity
import com.adipras.tirtasaas.core.database.entity.DraftUsageEntity
import com.adipras.tirtasaas.core.database.entity.SyncQueueEntity
import com.adipras.tirtasaas.core.database.entity.TenantSettingsEntity

@Database(
    entities = [
        SyncQueueEntity::class,
        TenantSettingsEntity::class,
        DraftUsageEntity::class,
        CachedCustomerEntity::class,
        CachedMeterEntity::class,
    ],
    version = 5,
    exportSchema = false,
)
abstract class TirtaDatabase : RoomDatabase() {
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun tenantSettingsDao(): TenantSettingsDao
    abstract fun draftUsageDao(): DraftUsageDao
    abstract fun customerDao(): CustomerDao
}
