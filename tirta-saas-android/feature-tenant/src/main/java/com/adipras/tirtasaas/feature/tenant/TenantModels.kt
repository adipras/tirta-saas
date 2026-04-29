package com.adipras.tirtasaas.feature.tenant

import com.adipras.tirtasaas.core.network.ApiResponse
import com.adipras.tirtasaas.core.network.PagedApiResponse
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TenantDto(
    val id: String,
    val name: String,
    @SerialName("village_code") val villageCode: String = "",
    val email: String = "",
    val phone: String = "",
    val address: String = "",
    @SerialName("admin_name") val adminName: String = "",
    @SerialName("admin_email") val adminEmail: String = "",
    @SerialName("admin_phone") val adminPhone: String = "",
    val status: String = "",
    @SerialName("subscription_plan") val subscriptionPlan: String = "",
    @SerialName("subscription_status") val subscriptionStatus: String = "",
    @SerialName("subscription_ends_at") val subscriptionEndsAt: String? = null,
    @SerialName("total_users") val totalUsers: Int = 0,
    @SerialName("total_customers") val totalCustomers: Int = 0,
    @SerialName("storage_used_gb") val storageUsedGb: Double = 0.0,
    val notes: String = "",
    @SerialName("registered_at") val registeredAt: String = "",
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("updated_at") val updatedAt: String = "",
)

typealias TenantListResponse = PagedApiResponse<List<TenantDto>>
typealias TenantDetailResponse = ApiResponse<TenantDto>

@Serializable
data class UpdateTenantRequest(
    val name: String,
    val email: String,
    val phone: String,
    val address: String,
    val notes: String = "",
)

@Serializable
data class RejectTenantRequest(
    val reason: String,
)
