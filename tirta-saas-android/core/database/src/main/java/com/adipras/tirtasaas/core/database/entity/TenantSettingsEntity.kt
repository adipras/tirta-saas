package com.adipras.tirtasaas.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tenant_settings")
data class TenantSettingsEntity(
    @PrimaryKey
    @ColumnInfo(name = "tenant_id")
    val tenantId: String,

    @ColumnInfo(name = "billing_cycle_day")
    val billingCycleDay: Int = 1,

    @ColumnInfo(name = "time_zone")
    val timeZone: String = "",

    @ColumnInfo(name = "receipt_template_version")
    val receiptTemplateVersion: String = "",

    @ColumnInfo(name = "default_printer_name")
    val defaultPrinterName: String? = null,

    @ColumnInfo(name = "paper_width_mm")
    val paperWidthMm: Int? = null,

    @ColumnInfo(name = "allow_offline_usage")
    val allowOfflineUsage: Boolean = false,

    @ColumnInfo(name = "require_photo_meter")
    val requirePhotoMeter: Boolean = false,

    @ColumnInfo(name = "updated_at")
    val updatedAt: String? = null,
)
