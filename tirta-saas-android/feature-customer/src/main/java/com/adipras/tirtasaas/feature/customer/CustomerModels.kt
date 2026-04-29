package com.adipras.tirtasaas.feature.customer

import com.adipras.tirtasaas.core.network.ApiResponse
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CustomerDto(
    val id: String,
    @SerialName("meter_number") val meterNumber: String,
    val name: String,
    val email: String = "",
    val phone: String = "",
    val address: String = "",
    @SerialName("subscription_id") val subscriptionId: String,
    val subscription: SubscriptionTypeDto? = null,
    @SerialName("is_active") val isActive: Boolean,
    @SerialName("created_at") val createdAt: String = "",
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
typealias CustomerDetailResponse = ApiResponse<CustomerDto>

@Serializable
data class CreateCustomerRequest(
    val name: String,
    val email: String,
    val phone: String,
    val address: String,
    val password: String,
    @SerialName("meter_number") val meterNumber: String,
    @SerialName("subscription_id") val subscriptionId: String,
)

@Serializable
data class UpdateCustomerRequest(
    val name: String,
    val email: String,
    val phone: String,
    val address: String,
    @SerialName("subscription_id") val subscriptionId: String,
)
