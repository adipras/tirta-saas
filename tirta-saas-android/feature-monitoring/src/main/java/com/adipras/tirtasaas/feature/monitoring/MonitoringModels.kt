package com.adipras.tirtasaas.feature.monitoring

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RevenueReportDto(
    @SerialName("total_revenue") val totalRevenue: Double = 0.0,
    @SerialName("total_payments") val totalPayments: Long = 0L,
)

@Serializable
data class CustomerReportDto(
    @SerialName("total_customers") val totalCustomers: Long = 0L,
    @SerialName("active_customers") val activeCustomers: Long = 0L,
    @SerialName("inactive_customers") val inactiveCustomers: Long = 0L,
)

@Serializable
data class UsageReportDto(
    @SerialName("total_usage") val totalUsage: Double = 0.0,
    @SerialName("average_usage") val averageUsage: Double = 0.0,
)

@Serializable
data class PaymentReportDto(
    @SerialName("total_collected") val totalCollected: Double = 0.0,
    @SerialName("total_outstanding") val totalOutstanding: Double = 0.0,
    @SerialName("total_payments") val totalPayments: Long = 0L,
)

@Serializable
data class OutstandingReportDto(
    @SerialName("total_outstanding") val totalOutstanding: Double = 0.0,
    @SerialName("unpaid_count") val unpaidCount: Long = 0L,
)

data class MonitoringSummary(
    val totalRevenue: Double,
    val paymentCount: Long,
    val totalCollected: Double,
    val totalOutstanding: Double,
    val unpaidInvoiceCount: Long,
    val totalCustomers: Long,
    val activeCustomers: Long,
    val inactiveCustomers: Long,
    val totalUsage: Double,
    val averageUsage: Double,
)
