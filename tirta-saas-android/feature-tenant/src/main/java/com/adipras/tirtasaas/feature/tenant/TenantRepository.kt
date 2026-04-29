package com.adipras.tirtasaas.feature.tenant

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TenantRepository @Inject constructor(
    private val tenantApiService: TenantApiService,
) {
    suspend fun getTenants(
        page: Int = 1,
        limit: Int = 20,
        search: String? = null,
        status: String? = null,
    ): Result<Pair<List<TenantDto>, Int>> = runCatching {
        val response = tenantApiService.getTenants(page, limit, search, status)
        Pair(response.data.orEmpty(), response.meta?.totalItems ?: 0)
    }

    suspend fun getPendingTenants(): Result<List<TenantDto>> = runCatching {
        tenantApiService.getPendingTenants().data.orEmpty()
    }

    suspend fun getTenant(id: String): Result<TenantDto> = runCatching {
        tenantApiService.getTenant(id).data ?: error("Tenant tidak ditemukan")
    }

    suspend fun updateTenant(id: String, request: UpdateTenantRequest): Result<TenantDto> = runCatching {
        tenantApiService.updateTenant(id, request).data ?: error("Gagal memperbarui tenant")
    }

    suspend fun approveTenant(id: String): Result<TenantDto> = runCatching {
        tenantApiService.approveTenant(id).data ?: error("Gagal menyetujui tenant")
    }

    suspend fun rejectTenant(id: String, reason: String): Result<TenantDto> = runCatching {
        tenantApiService.rejectTenant(id, RejectTenantRequest(reason)).data
            ?: error("Gagal menolak tenant")
    }

    suspend fun suspendTenant(id: String): Result<TenantDto> = runCatching {
        tenantApiService.suspendTenant(id).data ?: error("Gagal menangguhkan tenant")
    }

    suspend fun activateTenant(id: String): Result<TenantDto> = runCatching {
        tenantApiService.activateTenant(id).data ?: error("Gagal mengaktifkan tenant")
    }

    suspend fun deleteTenant(id: String): Result<Unit> = runCatching {
        tenantApiService.deleteTenant(id)
    }
}
