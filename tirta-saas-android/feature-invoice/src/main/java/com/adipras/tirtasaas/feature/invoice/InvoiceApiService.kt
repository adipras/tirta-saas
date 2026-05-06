package com.adipras.tirtasaas.feature.invoice

import com.adipras.tirtasaas.core.network.ApiResponse
import com.adipras.tirtasaas.core.network.PagedApiResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface InvoiceApiService {
    @GET("invoices")
    suspend fun getInvoices(
        @Query("page") page: Int = 1,
        @Query("page_size") pageSize: Int = 20,
        @Query("customer_id") customerId: String? = null,
        @Query("usage_month") usageMonth: String? = null,
        @Query("status") status: String? = null,
    ): PagedApiResponse<List<InvoiceDto>>

    @GET("invoices/{id}")
    suspend fun getInvoice(@Path("id") id: String): ApiResponse<InvoiceDto>

    @POST("invoices/{id}/generate-receipt")
    suspend fun generateReceipt(@Path("id") id: String): ApiResponse<InvoiceDto>
}
