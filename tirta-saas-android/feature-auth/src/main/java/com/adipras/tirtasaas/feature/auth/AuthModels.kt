package com.adipras.tirtasaas.feature.auth

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    @SerialName("email") val email: String,
    @SerialName("password") val password: String,
)

@Serializable
data class RefreshRequest(
    @SerialName("refresh_token") val refreshToken: String,
)

@Serializable
data class AuthUserDto(
    @SerialName("id") val id: String,
    @SerialName("email") val email: String,
    @SerialName("name") val name: String,
    @SerialName("role") val role: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    @SerialName("tenant_name") val tenantName: String? = null,
    @SerialName("tenant_logo_url") val tenantLogoUrl: String? = null,
    @SerialName("tenant_status") val tenantStatus: String? = null,
)

@Serializable
data class LoginResponse(
    @SerialName("token") val token: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("user") val user: AuthUserDto,
    @SerialName("role") val role: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    @SerialName("tenant_name") val tenantName: String? = null,
    @SerialName("tenant_status") val tenantStatus: String? = null,
)
