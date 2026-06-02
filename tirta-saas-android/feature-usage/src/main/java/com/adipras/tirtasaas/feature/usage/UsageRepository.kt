package com.adipras.tirtasaas.feature.usage

import com.adipras.tirtasaas.core.network.PagedApiResponse
import com.adipras.tirtasaas.core.network.requireData
import com.adipras.tirtasaas.feature.customer.CustomerRepository
import com.adipras.tirtasaas.feature.customer.MeterDto
import com.adipras.tirtasaas.feature.customer.MeterStartResolution
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UsageRepository @Inject constructor(
    private val api: UsageApiService,
    private val customerRepository: CustomerRepository,
) {
    suspend fun getCustomerMeters(customerId: String): Result<List<MeterDto>> =
        customerRepository.getCustomerMeters(customerId)

    suspend fun resolveMeterStart(meterId: String, usageMonth: String): Result<MeterStartResolution> =
        customerRepository.resolveMeterStart(meterId, usageMonth)
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

    suspend fun uploadUsagePhoto(
        id: String,
        fileName: String,
        mimeType: String,
        bytes: ByteArray,
    ): Result<WaterUsageDto> = runCatching {
        val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("photo", fileName, requestBody)
        api.uploadWaterUsagePhoto(id, part).requireData("Gagal mengunggah foto meter")
    }
}
