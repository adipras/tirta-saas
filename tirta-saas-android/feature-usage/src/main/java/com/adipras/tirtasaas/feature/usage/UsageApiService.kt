package com.adipras.tirtasaas.feature.usage

import com.adipras.tirtasaas.core.network.ApiResponse
import com.adipras.tirtasaas.core.network.PagedApiResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface UsageApiService {
    @GET("water-usage")
    suspend fun getWaterUsages(
        @Query("page") page: Int = 1,
        @Query("page_size") pageSize: Int = 20,
        @Query("customer_id") customerId: String? = null,
        @Query("usage_month") usageMonth: String? = null,
        @Query("include_drafts") includeDrafts: Boolean = false,
    ): PagedApiResponse<List<WaterUsageDto>>

    @GET("water-usage/{id}")
    suspend fun getWaterUsage(@Path("id") id: String): WaterUsageDto

    @POST("water-usage")
    suspend fun createWaterUsage(@Body request: CreateWaterUsageRequest): ApiResponse<WaterUsageDto>

    @PUT("water-usage/{id}")
    suspend fun updateWaterUsage(
        @Path("id") id: String,
        @Body request: UpdateWaterUsageRequest,
    ): ApiResponse<WaterUsageDto>
}
