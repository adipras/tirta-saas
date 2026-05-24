package com.adipras.tirtasaas.feature.monitoring

import com.adipras.tirtasaas.core.network.requireData
import java.time.LocalDate
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

@Singleton
class MonitoringRepository @Inject constructor(
    private val api: MonitoringApiService,
) {
    suspend fun getSummary(): Result<MonitoringSummary> = runCatching {
        coroutineScope {
            val endDate = LocalDate.now()
            val startDate = endDate.withDayOfMonth(1)
            val startDateQuery = startDate.toString()
            val endDateQuery = endDate.toString()

            val revenueDeferred = async {
                api.getRevenueReport(startDateQuery, endDateQuery)
                    .requireData("Gagal mengambil laporan pendapatan")
            }
            val customerDeferred = async {
                api.getCustomerReport(startDateQuery, endDateQuery)
                    .requireData("Gagal mengambil laporan pelanggan")
            }
            val usageDeferred = async {
                api.getUsageReport(startDateQuery, endDateQuery)
                    .requireData("Gagal mengambil laporan pemakaian")
            }
            val paymentDeferred = async {
                api.getPaymentReport(startDateQuery, endDateQuery)
                    .requireData("Gagal mengambil laporan pembayaran")
            }
            val outstandingDeferred = async {
                api.getOutstandingReport().requireData("Gagal mengambil laporan tunggakan")
            }

            val revenue = revenueDeferred.await()
            val customers = customerDeferred.await()
            val usage = usageDeferred.await()
            val payments = paymentDeferred.await()
            val outstanding = outstandingDeferred.await()

            MonitoringSummary(
                totalRevenue = revenue.totalRevenue,
                paymentCount = payments.totalPayments,
                totalCollected = payments.totalCollected,
                totalOutstanding = outstanding.totalOutstanding,
                unpaidInvoiceCount = outstanding.unpaidCount,
                totalCustomers = customers.totalCustomers,
                activeCustomers = customers.activeCustomers,
                inactiveCustomers = customers.inactiveCustomers,
                totalUsage = usage.totalUsage,
                averageUsage = usage.averageUsage,
            )
        }
    }
}
