package com.adipras.tirtasaas.feature.customer

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface CustomerApiService {
    @GET("customers")
    suspend fun getCustomers(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("search") search: String? = null,
        @Query("is_active") isActive: Boolean? = null,
    ): CustomerListResponse

    @GET("customers/{id}")
    suspend fun getCustomer(@Path("id") id: String): CustomerDetailResponse

    @POST("customers")
    suspend fun createCustomer(@Body request: CreateCustomerRequest): CustomerDetailResponse

    @PUT("customers/{id}")
    suspend fun updateCustomer(
        @Path("id") id: String,
        @Body request: UpdateCustomerRequest,
    ): CustomerDetailResponse

    @DELETE("customers/{id}")
    suspend fun deleteCustomer(@Path("id") id: String)

    @POST("customers/{id}/activate")
    suspend fun activateCustomer(@Path("id") id: String): CustomerDetailResponse

    @POST("customers/{id}/deactivate")
    suspend fun deactivateCustomer(@Path("id") id: String): CustomerDetailResponse
}
