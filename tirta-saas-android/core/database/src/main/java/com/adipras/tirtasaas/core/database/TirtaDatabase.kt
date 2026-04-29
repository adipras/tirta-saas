package com.adipras.tirtasaas.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.adipras.tirtasaas.core.database.dao.SyncQueueDao
import com.adipras.tirtasaas.core.database.entity.SyncQueueEntity

@Database(
    entities = [SyncQueueEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class TirtaDatabase : RoomDatabase() {
    abstract fun syncQueueDao(): SyncQueueDao
}
