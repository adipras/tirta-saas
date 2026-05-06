package com.adipras.tirtasaas.feature.payment

import com.adipras.tirtasaas.core.network.PagedApiResponse
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentRepository @Inject constructor(
    private val api: PaymentApiService,
) {
    suspend fun getPayments(
        page: Int = 1,
        invoiceId: String? = null,
    ): Result<PagedApiResponse<List<PaymentDto>>> = runCatching {
        api.getPayments(page = page, invoiceId = invoiceId)
    }

    suspend fun getPayment(id: String): Result<PaymentDto> = runCatching {
        api.getPayment(id).data ?: error("Pembayaran tidak ditemukan")
    }

    suspend fun createPayment(
        invoiceId: String,
        amount: Double,
        paymentMethod: String,
        notes: String?,
    ): Result<PaymentDto> = runCatching {
        val textType = "text/plain".toMediaTypeOrNull()
        api.createPayment(
            invoiceId = invoiceId.toRequestBody(textType),
            amount = amount.toString().toRequestBody(textType),
            paymentMethod = paymentMethod.toRequestBody(textType),
            notes = notes?.toRequestBody(textType),
            proof = null,
        ).data ?: error("Gagal membuat pembayaran")
    }
}
