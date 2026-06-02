package com.adipras.tirtasaas.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "draft_usages")
data class DraftUsageEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "customer_id")
    val customerId: String,

    @ColumnInfo(name = "meter_id")
    val meterId: String? = null,

    @ColumnInfo(name = "usage_month")
    val usageMonth: String,

    @ColumnInfo(name = "meter_end")
    val meterEnd: Double,

    @ColumnInfo(name = "notes")
    val notes: String? = null,

    @ColumnInfo(name = "is_synced")
    val isSynced: Boolean = false,

    @ColumnInfo(name = "created_at")
    val createdAt: String? = null,
)
