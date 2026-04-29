package com.adipras.tirtasaas.feature.user

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    @SerialName("tenant_name") val tenantName: String? = null,
    @SerialName("created_at") val createdAt: String = "",
)

@Serializable
data class CreateUserRequest(
    val name: String,
    val email: String,
    val password: String,
    val role: String,
    @SerialName("tenant_id") val tenantId: String? = null,
)

@Serializable
data class UpdateUserRequest(
    val name: String,
    val email: String,
    val role: String,
    val password: String? = null,
)

val availableRoles = listOf(
    "tenant_admin",
    "meter_reader",
    "finance",
    "customer",
)

val roleLabels = mapOf(
    "platform_owner" to "Platform Owner",
    "tenant_admin" to "Admin Tenant",
    "meter_reader" to "Petugas Meter",
    "finance" to "Keuangan",
    "customer" to "Pelanggan",
)
