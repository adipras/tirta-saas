package com.adipras.tirtasaas.feature.invoice

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class InvoiceDto(
    val id: String,
    @SerialName("invoice_number") val invoiceNumber: String,
    @SerialName("customer_id") val customerId: String,
    @SerialName("customer_name") val customerName: String = "",
    @SerialName("meter_number") val meterNumber: String = "",
    @SerialName("usage_month") val usageMonth: String = "",
    @SerialName("usage_m3") val usageM3: Double = 0.0,
    @SerialName("water_charge") val waterCharge: Double = 0.0,
    @SerialName("abonemen") val abonemen: Double = 0.0,
    @SerialName("sub_total") val subTotal: Double = 0.0,
    @SerialName("penalty_amount") val penaltyAmount: Double = 0.0,
    @SerialName("total_amount") val totalAmount: Double = 0.0,
    @SerialName("total_paid") val totalPaid: Double = 0.0,
    @SerialName("remaining_amount") val remainingAmount: Double = 0.0,
    @SerialName("payment_status") val paymentStatus: String = "",
    @SerialName("is_paid") val isPaid: Boolean = false,
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("paid_date") val paidDate: String? = null,
    @SerialName("created_at") val createdAt: String = "",
    val receipt: ReceiptPayloadDto? = null,
)

@Serializable
data class ReceiptPayloadDto(
    @SerialName("invoice_number") val invoiceNumber: String,
    @SerialName("customer_name") val customerName: String,
    @SerialName("meter_number") val meterNumber: String,
    val address: String = "",
    @SerialName("usage_month") val usageMonth: String,
    @SerialName("meter_start") val meterStart: Double = 0.0,
    @SerialName("meter_end") val meterEnd: Double = 0.0,
    @SerialName("usage_m3") val usageM3: Double = 0.0,
    @SerialName("water_charge") val waterCharge: Double = 0.0,
    @SerialName("abonemen") val abonemen: Double = 0.0,
    @SerialName("penalty_amount") val penaltyAmount: Double = 0.0,
    @SerialName("total_amount") val totalAmount: Double = 0.0,
    @SerialName("total_paid") val totalPaid: Double = 0.0,
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("company_name") val companyName: String = "",
    @SerialName("company_phone") val companyPhone: String = "",
    @SerialName("company_email") val companyEmail: String = "",
    @SerialName("footer_text") val footerText: String = "",
)
