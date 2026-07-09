package com.adipras.tirtasaas.feature.customer

import com.adipras.tirtasaas.core.network.ApiResponse
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CustomerDto(
    val id: String,
    val name: String,
    val email: String = "",
    val phone: String = "",
    val address: String = "",
    @SerialName("subscription_id") val subscriptionId: String = "",
    val subscription: SubscriptionTypeDto? = null,
    @SerialName("service_area_id") val serviceAreaId: String? = null,
    @SerialName("service_area_name") val serviceAreaName: String? = null,
    @SerialName("reading_route_id") val readingRouteId: String? = null,
    @SerialName("reading_route_name") val readingRouteName: String? = null,
    @SerialName("is_active") val isActive: Boolean,
    @SerialName("created_at") val createdAt: String = "",
    val meters: List<MeterDto> = emptyList(),
)

@Serializable
data class MeterDto(
    val id: String,
    @SerialName("meter_number") val meterNumber: String,
    @SerialName("location_name") val locationName: String? = null,
    val status: String = "active",
    @SerialName("subscription_type_id") val subscriptionTypeId: String? = null,
    @SerialName("subscription_type") val subscriptionType: SubscriptionTypeDto? = null,
    @SerialName("install_date") val installDate: String = "",
    @SerialName("initial_reading") val initialReading: Double = 0.0,
    @SerialName("latest_usage_month") val latestUsageMonth: String? = null,
    @SerialName("latest_meter_end") val latestMeterEnd: Double? = null,
)

@Serializable
data class CustomerDetailData(
    val customer: CustomerDto,
    val meters: List<MeterDto> = emptyList(),
)

@Serializable
data class MeterStartResolution(
    val value: Double,
    val source: String,
    val description: String,
    val month: String,
)

@Serializable
data class SubscriptionTypeDto(
    val id: String,
    val name: String,
    val description: String = "",
)

/** Inner data object inside { status, message, data: { customers, total } } */
@Serializable
data class CustomerListData(
    val customers: List<CustomerDto> = emptyList(),
    val total: Int = 0,
)

typealias CustomerListResponse = ApiResponse<CustomerListData>
typealias CustomerDetailResponse = ApiResponse<CustomerDetailData>

@Serializable
data class ServiceAreaDto(
    val id: String,
    val code: String = "",
    val name: String,
)

@Serializable
data class ServiceAreaListResponse(
    val data: List<ServiceAreaDto> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class MeterInputDto(
    @SerialName("meter_number") val meterNumber: String,
    @SerialName("location_name") val locationName: String? = null,
    @SerialName("subscription_type_id") val subscriptionTypeId: String,
    @SerialName("install_date") val installDate: String,
    @SerialName("initial_reading") val initialReading: Double = 0.0,
    val brand: String? = null,
    val model: String? = null,
    val notes: String? = null,
)

@Serializable
data class CreateCustomerRequest(
    val name: String,
    val email: String?,
    val phone: String,
    val address: String,
    val password: String,
    val meters: List<MeterInputDto>,
    @SerialName("service_area_id") val serviceAreaId: String? = null,
    @SerialName("reading_route_id") val readingRouteId: String? = null,
)

@Serializable
data class UpdateCustomerRequest(
    val name: String,
    val phone: String,
    val address: String,
    @SerialName("service_area_id") val serviceAreaId: String? = null,
    @SerialName("reading_route_id") val readingRouteId: String? = null,
)
