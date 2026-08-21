package com.adipras.tirtasaas.feature.customer

import com.adipras.tirtasaas.core.database.dao.CustomerDao
import com.adipras.tirtasaas.core.database.entity.CachedCustomerEntity
import com.adipras.tirtasaas.core.database.entity.CachedMeterEntity
import com.adipras.tirtasaas.core.database.entity.CustomerWithMeters
import com.adipras.tirtasaas.core.network.requireData
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CustomerRepository @Inject constructor(
    private val customerApiService: CustomerApiService,
    private val customerDao: CustomerDao,
) {
    suspend fun getCustomers(
        page: Int = 1,
        limit: Int = 20,
        search: String? = null,
        isActive: Boolean? = null,
        serviceAreaId: String? = null,
        readingRouteId: String? = null,
    ): Result<CustomerListData> = runCatching {
        try {
            val response = customerApiService.getCustomers(
                page = page,
                limit = limit,
                search = search,
                isActive = isActive,
                serviceAreaId = serviceAreaId,
                readingRouteId = readingRouteId,
            )
            val data = response.requireData("Daftar pelanggan tidak tersedia")
            cacheCustomers(data.customers)
            data
        } catch (e: Exception) {
            // Offline fallback
            val cached = if (!search.isNullOrBlank()) {
                customerDao.searchCustomers(search, limit)
            } else {
                customerDao.getAllCustomers()
            }
            if (cached.isNotEmpty()) {
                CustomerListData(
                    customers = cached.map { it.toDto() },
                    total = cached.size,
                )
            } else {
                throw e
            }
        }
    }

    suspend fun getCustomer(id: String): Result<CustomerDetailData> = runCatching {
        try {
            val detail = customerApiService.getCustomer(id).requireData("Pelanggan tidak ditemukan")
            cacheCustomerWithMeters(detail.customer, detail.meters)
            detail
        } catch (e: Exception) {
            val cached = customerDao.getCustomerById(id)
            if (cached != null) {
                val customerDto = cached.toDto()
                CustomerDetailData(
                    customer = customerDto,
                    meters = customerDto.meters,
                )
            } else {
                throw e
            }
        }
    }

    suspend fun getCustomerMeters(customerId: String): Result<List<MeterDto>> = runCatching {
        try {
            val detail = customerApiService.getCustomer(customerId).requireData("Pelanggan tidak ditemukan")
            cacheCustomerWithMeters(detail.customer, detail.meters)
            detail.meters.filter { it.status == "active" }
        } catch (e: Exception) {
            val cachedMeters = customerDao.getActiveMetersByCustomerId(customerId)
            if (cachedMeters.isNotEmpty()) {
                cachedMeters.map { it.toDto() }
            } else {
                throw e
            }
        }
    }

    suspend fun resolveMeterStart(meterId: String, month: String): Result<MeterStartResolution> = runCatching {
        try {
            customerApiService.resolveMeterStart(meterId, month).requireData("Gagal mengambil angka awal meter")
        } catch (e: Exception) {
            val cachedMeter = customerDao.getMeterById(meterId)
            if (cachedMeter != null) {
                when {
                    cachedMeter.latestMeterEnd != null -> MeterStartResolution(
                        value = cachedMeter.latestMeterEnd,
                        source = "previous_reading",
                        description = "Dari bacaan tersimpan offline",
                        month = month,
                    )
                    cachedMeter.initialReading > 0.0 -> MeterStartResolution(
                        value = cachedMeter.initialReading,
                        source = "initial_reading",
                        description = "Dari angka awal meter (offline)",
                        month = month,
                    )
                    else -> MeterStartResolution(
                        value = 0.0,
                        source = "default",
                        description = "Default: 0.00 (offline)",
                        month = month,
                    )
                }
            } else {
                throw e
            }
        }
    }

    suspend fun createCustomer(request: CreateCustomerRequest): Result<CustomerDetailData> = runCatching {
        val detail = customerApiService.createCustomer(request).requireData("Gagal membuat pelanggan")
        cacheCustomerWithMeters(detail.customer, detail.meters)
        detail
    }

    suspend fun updateCustomer(id: String, request: UpdateCustomerRequest): Result<CustomerDetailData> = runCatching {
        val detail = customerApiService.updateCustomer(id, request).requireData("Gagal memperbarui pelanggan")
        cacheCustomerWithMeters(detail.customer, detail.meters)
        detail
    }

    suspend fun getSubscriptionTypes(): Result<List<SubscriptionTypeDto>> = runCatching {
        customerApiService.getSubscriptionTypes()
    }

    suspend fun getServiceAreas(): Result<List<ServiceAreaDto>> = runCatching {
        customerApiService.getServiceAreas().data
    }

    suspend fun deleteCustomer(id: String): Result<Unit> = runCatching {
        customerApiService.deleteCustomer(id)
        customerDao.deleteMetersForCustomer(id)
    }

    suspend fun setActive(id: String, active: Boolean): Result<CustomerDto> = runCatching {
        val response = if (active) customerApiService.activateCustomer(id)
        else customerApiService.deactivateCustomer(id)
        val customer = response.requireData("Gagal mengubah status pelanggan")
        cacheCustomerWithMeters(customer, customer.meters)
        customer
    }

    private suspend fun cacheCustomers(customers: List<CustomerDto>) {
        if (customers.isEmpty()) return
        val customerEntities = customers.map { it.toEntity() }
        val meterEntities = customers.flatMap { customer ->
            customer.meters.map { it.toEntity(customer.id) }
        }
        customerDao.upsertCustomersWithMeters(customerEntities, meterEntities)
    }

    private suspend fun cacheCustomerWithMeters(customer: CustomerDto, meters: List<MeterDto>) {
        val customerEntity = customer.toEntity()
        val meterEntities = meters.map { it.toEntity(customer.id) }
        customerDao.upsertCustomerWithMeters(customerEntity, meterEntities)
    }
}

private fun CustomerDto.toEntity() = CachedCustomerEntity(
    id = id,
    name = name,
    email = email,
    phone = phone,
    address = address,
    subscriptionId = subscriptionId,
    subscriptionName = subscription?.name ?: "",
    serviceAreaId = serviceAreaId,
    serviceAreaName = serviceAreaName,
    readingRouteId = readingRouteId,
    readingRouteName = readingRouteName,
    isActive = isActive,
    updatedAt = System.currentTimeMillis(),
)

private fun MeterDto.toEntity(customerId: String) = CachedMeterEntity(
    id = id,
    customerId = customerId,
    meterNumber = meterNumber,
    locationName = locationName,
    status = status,
    subscriptionTypeId = subscriptionTypeId,
    subscriptionTypeName = subscriptionType?.name,
    installDate = installDate,
    initialReading = initialReading,
    latestUsageMonth = latestUsageMonth,
    latestMeterEnd = latestMeterEnd,
)

private fun CustomerWithMeters.toDto() = CustomerDto(
    id = customer.id,
    name = customer.name,
    email = customer.email,
    phone = customer.phone,
    address = customer.address,
    subscriptionId = customer.subscriptionId,
    subscription = if (customer.subscriptionName.isNotBlank()) {
        SubscriptionTypeDto(id = customer.subscriptionId, name = customer.subscriptionName)
    } else null,
    serviceAreaId = customer.serviceAreaId,
    serviceAreaName = customer.serviceAreaName,
    readingRouteId = customer.readingRouteId,
    readingRouteName = customer.readingRouteName,
    isActive = customer.isActive,
    meters = meters.map { it.toDto() },
)

private fun CachedMeterEntity.toDto() = MeterDto(
    id = id,
    meterNumber = meterNumber,
    locationName = locationName,
    status = status,
    subscriptionTypeId = subscriptionTypeId,
    subscriptionType = if (!subscriptionTypeName.isNullOrBlank()) {
        SubscriptionTypeDto(id = subscriptionTypeId ?: "", name = subscriptionTypeName)
    } else null,
    installDate = installDate,
    initialReading = initialReading,
    latestUsageMonth = latestUsageMonth,
    latestMeterEnd = latestMeterEnd,
)
