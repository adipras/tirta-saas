package com.adipras.tirtasaas.feature.usage

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "draft_usages")
data class DraftUsageEntity(
    @PrimaryKey val id: String,
    val tenantId: String?,
    val customerId: String,
    val year: Int,
    val month: Int,
    val meterStart: Int,
    val meterEnd: Int,
    val isDraft: Boolean = true,
    val syncedAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis()
)
