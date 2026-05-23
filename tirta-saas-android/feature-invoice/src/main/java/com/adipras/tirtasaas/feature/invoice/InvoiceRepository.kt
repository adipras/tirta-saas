package com.adipras.tirtasaas.feature.invoice

import com.adipras.tirtasaas.core.network.PagedApiResponse
import com.adipras.tirtasaas.core.network.requireData
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InvoiceRepository @Inject constructor(
    private val api: InvoiceApiService,
) {
    suspend fun getInvoices(
        page: Int = 1,
        pageSize: Int = 20,
        customerId: String? = null,
        usageMonth: String? = null,
        status: String? = null,
    ): Result<PagedApiResponse<List<InvoiceDto>>> = runCatching {
        api.getInvoices(page = page, pageSize = pageSize, customerId = customerId, usageMonth = usageMonth, status = status)
    }

    suspend fun getInvoice(id: String): Result<InvoiceDto> = runCatching {
        api.getInvoice(id).requireData("Invoice tidak ditemukan")
    }
}
