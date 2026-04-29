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
    ): Result<CustomerListResponse> = runCatching {
        customerApiService.getCustomers(page, limit, search, isActive)
    }

    suspend fun getCustomer(id: String): Result<CustomerDto> = runCatching {
        customerApiService.getCustomer(id)
    }

    suspend fun createCustomer(request: CreateCustomerRequest): Result<CustomerDto> = runCatching {
        customerApiService.createCustomer(request)
    }

    suspend fun updateCustomer(id: String, request: UpdateCustomerRequest): Result<CustomerDto> = runCatching {
        customerApiService.updateCustomer(id, request)
    }

    suspend fun deleteCustomer(id: String): Result<Unit> = runCatching {
        customerApiService.deleteCustomer(id)
    }

    suspend fun setActive(id: String, active: Boolean): Result<CustomerDto> = runCatching {
        if (active) customerApiService.activateCustomer(id)
        else customerApiService.deactivateCustomer(id)
    }
}
