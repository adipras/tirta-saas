package com.adipras.tirtasaas.feature.usage

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class WaterUsageDto(
    val id: String,
    @SerialName("customer_id") val customerId: String,
    val customer: WaterUsageCustomerDto? = null,
    @SerialName("usage_month") val usageMonth: String,
    @SerialName("meter_start") val meterStart: Double = 0.0,
    @SerialName("meter_end") val meterEnd: Double,
    @SerialName("usage_m3") val usageM3: Double = 0.0,
    @SerialName("amount_calculated") val amountCalculated: Double = 0.0,
    @SerialName("photo_url") val photoUrl: String = "",
    @SerialName("is_draft") val isDraft: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class WaterUsageCustomerDto(
    val id: String,
    val name: String,
    @SerialName("meter_number") val meterNumber: String = "",
    val address: String = "",
)

@Serializable
data class CreateWaterUsageRequest(
    val id: String? = null,
    @SerialName("customer_id") val customerId: String,
    @SerialName("meter_id") val meterId: String? = null,
    @SerialName("usage_month") val usageMonth: String,
    @SerialName("meter_end") val meterEnd: Double,
    val notes: String? = null,
    @SerialName("is_draft") val isDraft: Boolean = false,
)

@Serializable
data class UpdateWaterUsageRequest(
    @SerialName("meter_end") val meterEnd: Double,
    val notes: String? = null,
)
