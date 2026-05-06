package com.adipras.tirtasaas.feature.tenant

import com.adipras.tirtasaas.core.database.dao.TenantSettingsDao
import com.adipras.tirtasaas.core.database.entity.TenantSettingsEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TenantSettingsRepository @Inject constructor(
    private val tenantApiService: TenantApiService,
    private val tenantSettingsDao: TenantSettingsDao,
) {
    suspend fun fetchAndCache(tenantId: String?): Result<TenantSettingsDto> = runCatching {
        val id = tenantId ?: error("Tenant id kosong")
        val response = tenantApiService.getTenantSettings()
        val settings = response.data ?: error("Tenant settings tidak ditemukan")
        // persist to local db (map subset of fields)
        withContext(Dispatchers.IO) {
            val entity = TenantSettingsEntity(
                tenantId = id,
                billingCycleDay = settings.invoiceGenerationDay,
                timeZone = settings.timezone ?: "",
                receiptTemplateVersion = null ?: "",
                defaultPrinterName = null,
                paperWidthMm = null,
                allowOfflineUsage = false,
                requirePhotoMeter = false,
                updatedAt = settings.updatedAt,
            )
            tenantSettingsDao.upsert(entity)
        }
        settings
    }

    suspend fun getCached(tenantId: String): TenantSettingsDto? = withContext(Dispatchers.IO) {
        tenantSettingsDao.getSettings(tenantId)?.let { entity ->
            TenantSettingsDto(
                tenantId = entity.tenantId,
                companyName = null,
                address = null,
                phone = null,
                email = null,
                website = null,
                logoUrl = null,
                primaryColor = null,
                secondaryColor = null,
                invoiceGenerationDay = entity.billingCycleDay,
                invoiceDueDay = 0,
                invoicePrefix = null,
                invoiceNumberFormat = null,
                invoiceDueDays = 0,
                invoiceFooterText = null,
                latePenaltyPercent = 0.0,
                latePenaltyMaxCap = null,
                gracePeriodDays = 0,
                minimumBillAmount = 0.0,
                paymentMethods = emptyList(),
                bankName = null,
                bankAccountName = null,
                bankAccountNo = null,
                operatingHours = null,
                serviceArea = null,
                timezone = entity.timeZone,
                language = null,
                currency = null,
                createdAt = null,
                updatedAt = entity.updatedAt,
                customSettings = null,
            )
        }
    }
}
