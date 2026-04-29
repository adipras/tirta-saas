package com.adipras.tirtasaas.core.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Standard wrapped response: { status, message, data } */
@Serializable
data class ApiResponse<T>(
    val status: String = "",
    val message: String = "",
    val data: T? = null,
)

/** Paginated wrapped response: { status, message, data, meta } */
@Serializable
data class PagedApiResponse<T>(
    val status: String = "",
    val message: String = "",
    val data: T? = null,
    val meta: PaginationMeta? = null,
)

@Serializable
data class PaginationMeta(
    @SerialName("current_page") val currentPage: Int = 1,
    @SerialName("page_size") val pageSize: Int = 20,
    @SerialName("total_pages") val totalPages: Int = 1,
    @SerialName("total_items") val totalItems: Int = 0,
)
