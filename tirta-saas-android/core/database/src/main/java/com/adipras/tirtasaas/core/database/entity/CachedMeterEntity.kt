package com.adipras.tirtasaas.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "cached_meters",
    foreignKeys = [
        ForeignKey(
            entity = CachedCustomerEntity::class,
            parentColumns = ["id"],
            childColumns = ["customer_id"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [
        Index(value = ["customer_id"]),
        Index(value = ["meter_number"]),
    ],
)
data class CachedMeterEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "customer_id") val customerId: String,
    @ColumnInfo(name = "meter_number") val meterNumber: String,
    @ColumnInfo(name = "location_name") val locationName: String? = null,
    val status: String = "active",
    @ColumnInfo(name = "subscription_type_id") val subscriptionTypeId: String? = null,
    @ColumnInfo(name = "subscription_type_name") val subscriptionTypeName: String? = null,
    @ColumnInfo(name = "install_date") val installDate: String = "",
    @ColumnInfo(name = "initial_reading") val initialReading: Double = 0.0,
    @ColumnInfo(name = "latest_usage_month") val latestUsageMonth: String? = null,
    @ColumnInfo(name = "latest_meter_end") val latestMeterEnd: Double? = null,
)
