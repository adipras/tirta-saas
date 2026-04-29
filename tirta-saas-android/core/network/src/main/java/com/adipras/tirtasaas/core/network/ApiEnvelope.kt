package com.adipras.tirtasaas.core.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ApiEnvelope<T>(
    @SerialName("success") val success: Boolean,
    @SerialName("data") val data: T? = null,
    @SerialName("error") val error: ApiError? = null,
)

@Serializable
data class ApiError(
    @SerialName("code") val code: String? = null,
    @SerialName("message") val message: String,
)
