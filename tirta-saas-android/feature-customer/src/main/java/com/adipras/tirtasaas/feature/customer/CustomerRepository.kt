package com.adipras.tirtasaas.feature.customer

import com.adipras.tirtasaas.core.network.requireData
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CustomerRepository @Inject constructor(
    private val customerApiService: CustomerApiService,
) {
    suspend fun getCustomers(
        page: Int = 1,
        limit: Int = 20,
        search: String? = null,
        isActive: Boolean? = null,
        serviceAreaId: String? = null,
        readingRouteId: String? = null,
    ): Result<CustomerListData> = runCatching {
        val response = customerApiService.getCustomers(
            page = page,
            limit = limit,
            search = search,
            isActive = isActive,
            serviceAreaId = serviceAreaId,
            readingRouteId = readingRouteId,
        )
        response.requireData("Daftar pelanggan tidak tersedia")
    }

    suspend fun getCustomer(id: String): Result<CustomerDetailData> = runCatching {
        customerApiService.getCustomer(id).requireData("Pelanggan tidak ditemukan")
    }

    suspend fun getCustomerMeters(customerId: String): Result<List<MeterDto>> = runCatching {
        val detail = customerApiService.getCustomer(customerId).requireData("Pelanggan tidak ditemukan")
        detail.meters.filter { it.status == "active" }
    }

    suspend fun resolveMeterStart(meterId: String, month: String): Result<MeterStartResolution> = runCatching {
        customerApiService.resolveMeterStart(meterId, month).requireData("Gagal mengambil angka awal meter")
    }

    suspend fun createCustomer(request: CreateCustomerRequest): Result<CustomerDetailData> = runCatching {
        customerApiService.createCustomer(request).requireData("Gagal membuat pelanggan")
    }

    suspend fun updateCustomer(id: String, request: UpdateCustomerRequest): Result<CustomerDetailData> = runCatching {
        customerApiService.updateCustomer(id, request).requireData("Gagal memperbarui pelanggan")
    }

    suspend fun getSubscriptionTypes(): Result<List<SubscriptionTypeDto>> = runCatching {
        customerApiService.getSubscriptionTypes()
    }

    suspend fun getServiceAreas(): Result<List<ServiceAreaDto>> = runCatching {
        customerApiService.getServiceAreas().data
    }

    suspend fun deleteCustomer(id: String): Result<Unit> = runCatching {
        customerApiService.deleteCustomer(id)
    }

    suspend fun setActive(id: String, active: Boolean): Result<CustomerDto> = runCatching {
        val response = if (active) customerApiService.activateCustomer(id)
        else customerApiService.deactivateCustomer(id)
        response.requireData("Gagal mengubah status pelanggan")
    }
}
