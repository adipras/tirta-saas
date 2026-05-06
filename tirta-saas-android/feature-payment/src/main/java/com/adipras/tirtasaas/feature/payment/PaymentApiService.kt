package com.adipras.tirtasaas.feature.payment

import com.adipras.tirtasaas.core.network.ApiResponse
import com.adipras.tirtasaas.core.network.PagedApiResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.*

interface PaymentApiService {
    @GET("payments")
    suspend fun getPayments(
        @Query("page") page: Int = 1,
        @Query("page_size") pageSize: Int = 20,
        @Query("invoice_id") invoiceId: String? = null,
    ): PagedApiResponse<List<PaymentDto>>

    @GET("payments/{id}")
    suspend fun getPayment(@Path("id") id: String): ApiResponse<PaymentDto>

    @Multipart
    @POST("payments")
    suspend fun createPayment(
        @Part("invoice_id") invoiceId: RequestBody,
        @Part("amount") amount: RequestBody,
        @Part("payment_method") paymentMethod: RequestBody,
        @Part("notes") notes: RequestBody?,
        @Part proof: MultipartBody.Part?,
    ): ApiResponse<PaymentDto>

    @POST("payments/{id}/verify")
    suspend fun verifyPayment(@Path("id") id: String): ApiResponse<PaymentDto>
}
