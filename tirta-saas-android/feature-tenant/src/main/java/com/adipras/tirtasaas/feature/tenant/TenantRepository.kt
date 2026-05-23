package com.adipras.tirtasaas.feature.tenant

import com.adipras.tirtasaas.core.network.requireData
import com.adipras.tirtasaas.core.network.totalItemsOrZero
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TenantRepository @Inject constructor(
    private val tenantApiService: TenantApiService,
) {
    suspend fun getTenants(
        page: Int = 1,
        pageSize: Int = 20,
        search: String? = null,
        status: String? = null,
    ): Result<Pair<List<TenantDto>, Int>> = runCatching {
        val response = tenantApiService.getTenants(page, pageSize, search, status)
        Pair(response.data.orEmpty(), response.totalItemsOrZero())
    }

    suspend fun getPendingTenants(): Result<List<TenantDto>> = runCatching {
        tenantApiService.getPendingTenants().data.orEmpty()
    }

    suspend fun getTenant(id: String): Result<TenantDto> = runCatching {
        tenantApiService.getTenant(id).requireData("Tenant tidak ditemukan")
    }

    suspend fun updateTenant(id: String, request: UpdateTenantRequest): Result<TenantDto> = runCatching {
        tenantApiService.updateTenant(id, request).requireData("Gagal memperbarui tenant")
    }

    suspend fun approveTenant(id: String): Result<TenantDto> = runCatching {
        tenantApiService.approveTenant(id).requireData("Gagal menyetujui tenant")
    }

    suspend fun rejectTenant(id: String, reason: String): Result<TenantDto> = runCatching {
        tenantApiService.rejectTenant(id, RejectTenantRequest(reason)).requireData("Gagal menolak tenant")
    }

    suspend fun suspendTenant(id: String): Result<TenantDto> = runCatching {
        tenantApiService.suspendTenant(id).requireData("Gagal menangguhkan tenant")
    }

    suspend fun activateTenant(id: String): Result<TenantDto> = runCatching {
        tenantApiService.activateTenant(id).requireData("Gagal mengaktifkan tenant")
    }

    suspend fun deleteTenant(id: String): Result<Unit> = runCatching {
        tenantApiService.deleteTenant(id)
    }
}
