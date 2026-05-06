package com.adipras.tirtasaas.feature.payment

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PaymentDto(
    val id: String,
    @SerialName("invoice_id") val invoiceId: String,
    @SerialName("invoice_number") val invoiceNumber: String = "",
    @SerialName("customer_name") val customerName: String = "",
    val amount: Double,
    @SerialName("payment_method") val paymentMethod: String = "",
    val status: String = "",
    val notes: String? = null,
    @SerialName("proof_url") val proofUrl: String? = null,
    @SerialName("proof_status") val proofStatus: String = "",
    @SerialName("paid_at") val paidAt: String? = null,
    @SerialName("created_at") val createdAt: String = "",
)
