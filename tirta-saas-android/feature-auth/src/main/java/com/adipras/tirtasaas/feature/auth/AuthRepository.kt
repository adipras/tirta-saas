package com.adipras.tirtasaas.feature.auth

import com.adipras.tirtasaas.core.network.TokenRefreshCallback
import com.adipras.tirtasaas.core.security.session.SessionStorage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApiService: AuthApiService,
    private val sessionStorage: SessionStorage,
) : TokenRefreshCallback {

    suspend fun login(email: String, password: String): Result<LoginResponse> = runCatching {
        val response = authApiService.login(LoginRequest(email, password))
        val tenantStatus = resolveTenantStatus(response)
        ensureTenantAccess(tenantStatus)
        sessionStorage.saveSession(
            accessToken = response.token,
            refreshToken = response.refreshToken,
            tenantStatus = tenantStatus,
        )
        response
    }

    suspend fun logout(): Result<Unit> = runCatching {
        // Best-effort server logout; session is cleared regardless
        runCatching { authApiService.logout() }
        sessionStorage.clearSession()
    }

    suspend fun refreshSession(refreshToken: String): Result<LoginResponse> = runCatching {
        val response = authApiService.refresh(RefreshRequest(refreshToken))
        val tenantStatus = resolveTenantStatus(response)
        ensureTenantAccess(tenantStatus)
        sessionStorage.saveSession(
            accessToken = response.token,
            refreshToken = response.refreshToken,
            tenantStatus = tenantStatus,
        )
        response
    }

    suspend fun clearLocalSession() {
        sessionStorage.clearSession()
    }

    /** Called by [com.adipras.tirtasaas.core.network.TokenAuthenticator] on 401 responses. */
    override suspend fun onRefreshNeeded(): Boolean {
        val storedRefreshToken = sessionStorage.getRefreshToken() ?: return false
        return refreshSession(storedRefreshToken).isSuccess
    }

    private fun resolveTenantStatus(response: LoginResponse): String? =
        response.tenantStatus ?: response.user.tenantStatus

    private suspend fun ensureTenantAccess(tenantStatus: String?) {
        val normalizedStatus = tenantStatus?.uppercase() ?: return
        if (normalizedStatus == "SUSPENDED" || normalizedStatus == "EXPIRED") {
            sessionStorage.clearSession()
            throw TenantAccessBlockedException(normalizedStatus)
        }
    }
}

class TenantAccessBlockedException(
    tenantStatus: String,
) : IllegalStateException(
    when (tenantStatus) {
        "SUSPENDED" -> "Tenant sedang ditangguhkan. Silakan hubungi administrator platform."
        "EXPIRED" -> "Langganan tenant sudah kedaluwarsa. Silakan perpanjang langganan."
        else -> "Akses tenant tidak tersedia."
    },
)
