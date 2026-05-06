package com.adipras.tirtasaas.feature.tenant

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface TenantApiService {
    @GET("platform/tenants")
    suspend fun getTenants(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null,
        @Query("status") status: String? = null,
    ): TenantListResponse

    @GET("platform/tenants/pending")
    suspend fun getPendingTenants(): TenantListResponse

    @GET("platform/tenants/{id}")
    suspend fun getTenant(@Path("id") id: String): TenantDetailResponse

    @PUT("platform/tenants/{id}")
    suspend fun updateTenant(
        @Path("id") id: String,
        @Body request: UpdateTenantRequest,
    ): TenantDetailResponse

    @POST("platform/tenants/{id}/approve")
    suspend fun approveTenant(@Path("id") id: String): TenantDetailResponse

    @POST("platform/tenants/{id}/reject")
    suspend fun rejectTenant(
        @Path("id") id: String,
        @Body request: RejectTenantRequest,
    ): TenantDetailResponse

    @POST("platform/tenants/{id}/suspend")
    suspend fun suspendTenant(@Path("id") id: String): TenantDetailResponse

    @POST("platform/tenants/{id}/activate")
    suspend fun activateTenant(@Path("id") id: String): TenantDetailResponse

    @DELETE("platform/tenants/{id}")
    suspend fun deleteTenant(@Path("id") id: String)

    // Tenant settings — no path ID, resolved from JWT context on server
    @GET("tenant/settings")
    suspend fun getTenantSettings(): com.adipras.tirtasaas.core.network.ApiResponse<TenantSettingsDto>

    @PUT("tenant/settings")
    suspend fun updateTenantSettings(
        @Body request: TenantSettingsUpdateRequest,
    ): com.adipras.tirtasaas.core.network.ApiResponse<TenantSettingsDto>
}
