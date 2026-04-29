package com.adipras.tirtasaas.feature.customer

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
    ): Result<CustomerListData> = runCatching {
        val response = customerApiService.getCustomers(page, limit, search, isActive)
        response.data ?: CustomerListData()
    }

    suspend fun getCustomer(id: String): Result<CustomerDto> = runCatching {
        customerApiService.getCustomer(id).data
            ?: error("Customer tidak ditemukan")
    }

    suspend fun createCustomer(request: CreateCustomerRequest): Result<CustomerDto> = runCatching {
        customerApiService.createCustomer(request).data
            ?: error("Gagal membuat pelanggan")
    }

    suspend fun updateCustomer(id: String, request: UpdateCustomerRequest): Result<CustomerDto> = runCatching {
        customerApiService.updateCustomer(id, request).data
            ?: error("Gagal memperbarui pelanggan")
    }

    suspend fun getSubscriptionTypes(): Result<List<SubscriptionTypeDto>> = runCatching {
        customerApiService.getSubscriptionTypes()
    }

    suspend fun deleteCustomer(id: String): Result<Unit> = runCatching {
        customerApiService.deleteCustomer(id)
    }

    suspend fun setActive(id: String, active: Boolean): Result<CustomerDto> = runCatching {
        val response = if (active) customerApiService.activateCustomer(id)
        else customerApiService.deactivateCustomer(id)
        response.data ?: error("Gagal mengubah status pelanggan")
    }
}
