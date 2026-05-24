package com.adipras.tirtasaas.feature.monitoring

import com.adipras.tirtasaas.core.network.ApiResponse
import retrofit2.http.GET
import retrofit2.http.Query

interface MonitoringApiService {
    @GET("reports/revenue")
    suspend fun getRevenueReport(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null,
    ): ApiResponse<RevenueReportDto>

    @GET("reports/customers")
    suspend fun getCustomerReport(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null,
    ): ApiResponse<CustomerReportDto>

    @GET("reports/usage")
    suspend fun getUsageReport(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null,
    ): ApiResponse<UsageReportDto>

    @GET("reports/payments")
    suspend fun getPaymentReport(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null,
    ): ApiResponse<PaymentReportDto>

    @GET("reports/outstanding")
    suspend fun getOutstandingReport(): ApiResponse<OutstandingReportDto>
}
