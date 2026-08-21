package com.adipras.tirtasaas.core.database.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_customers")
data class CachedCustomerEntity(
    @PrimaryKey val id: String,
    val name: String,
    val email: String = "",
    val phone: String = "",
    val address: String = "",
    @ColumnInfo(name = "subscription_id") val subscriptionId: String = "",
    @ColumnInfo(name = "subscription_name") val subscriptionName: String = "",
    @ColumnInfo(name = "service_area_id") val serviceAreaId: String? = null,
    @ColumnInfo(name = "service_area_name") val serviceAreaName: String? = null,
    @ColumnInfo(name = "reading_route_id") val readingRouteId: String? = null,
    @ColumnInfo(name = "reading_route_name") val readingRouteName: String? = null,
    @ColumnInfo(name = "is_active") val isActive: Boolean = true,
    @ColumnInfo(name = "updated_at") val updatedAt: Long = System.currentTimeMillis(),
)
