package com.adipras.tirtasaas.core.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey val id: String,
    val type: String,
    val payload: String,
    val status: String,
    val createdAtEpochMillis: Long,
)
