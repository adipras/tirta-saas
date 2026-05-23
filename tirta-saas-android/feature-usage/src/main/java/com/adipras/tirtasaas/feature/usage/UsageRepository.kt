package com.adipras.tirtasaas.feature.usage

import com.adipras.tirtasaas.core.network.PagedApiResponse
import com.adipras.tirtasaas.core.network.requireData
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UsageRepository @Inject constructor(
    private val api: UsageApiService,
) {
    suspend fun getUsages(
        page: Int = 1,
        pageSize: Int = 20,
        customerId: String? = null,
        usageMonth: String? = null,
        includeDrafts: Boolean = false,
    ): Result<PagedApiResponse<List<WaterUsageDto>>> = runCatching {
        api.getWaterUsages(
            page = page,
            pageSize = pageSize,
            customerId = customerId,
            usageMonth = usageMonth,
            includeDrafts = includeDrafts,
        )
    }

    suspend fun getUsageById(id: String): Result<WaterUsageDto> = runCatching {
        api.getWaterUsage(id)
    }

    suspend fun createUsage(request: CreateWaterUsageRequest): Result<WaterUsageDto> = runCatching {
        api.createWaterUsage(request).requireData("Gagal membuat data pemakaian")
    }

    suspend fun updateUsage(id: String, request: UpdateWaterUsageRequest): Result<WaterUsageDto> = runCatching {
        api.updateWaterUsage(id, request).requireData("Gagal memperbarui data pemakaian")
    }
}
