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
        sessionStorage.saveSession(
            accessToken = response.token,
            refreshToken = response.refreshToken,
            tenantStatus = response.tenantStatus,
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
        sessionStorage.saveSession(
            accessToken = response.token,
            refreshToken = response.refreshToken,
            tenantStatus = response.tenantStatus,
        )
        response
    }

    /** Called by [com.adipras.tirtasaas.core.network.TokenAuthenticator] on 401 responses. */
    override suspend fun onRefreshNeeded(): Boolean {
        val storedRefreshToken = sessionStorage.getRefreshToken() ?: return false
        return refreshSession(storedRefreshToken).isSuccess
    }
}
