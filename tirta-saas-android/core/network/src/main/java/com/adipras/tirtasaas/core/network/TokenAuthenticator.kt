package com.adipras.tirtasaas.core.network

import com.adipras.tirtasaas.core.common.TokenProvider
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import timber.log.Timber
import java.util.concurrent.atomic.AtomicBoolean
import javax.inject.Inject
import javax.inject.Provider

/**
 * OkHttp Authenticator that handles 401 responses by refreshing the JWT token.
 * Uses Provider<TokenRefreshCallback> to avoid circular Hilt dependency
 * (NetworkModule → Authenticator → AuthRepository → Retrofit → NetworkModule).
 */
class TokenAuthenticator @Inject constructor(
    private val tokenProvider: TokenProvider,
    private val refreshCallbackProvider: Provider<TokenRefreshCallback>,
) : Authenticator {

    private val isRefreshing = AtomicBoolean(false)

    override fun authenticate(route: Route?, response: Response): Request? {
        // Avoid infinite loop: if the refresh request itself returned 401, give up
        if (response.request.url.encodedPath.contains("auth/refresh") ||
            response.request.url.encodedPath.contains("auth/login")
        ) {
            return null
        }

        // Only one thread should refresh at a time
        if (!isRefreshing.compareAndSet(false, true)) {
            // Another thread is already refreshing; wait and retry with the new token
            val newToken = tokenProvider.getAccessToken()
            return if (newToken != null) {
                response.request.newBuilder()
                    .header("Authorization", "Bearer $newToken")
                    .build()
            } else {
                null
            }
        }

        return try {
            val refreshed = runBlocking {
                refreshCallbackProvider.get().onRefreshNeeded()
            }
            if (refreshed) {
                val newToken = tokenProvider.getAccessToken()
                if (newToken != null) {
                    response.request.newBuilder()
                        .header("Authorization", "Bearer $newToken")
                        .build()
                } else {
                    null
                }
            } else {
                Timber.w("Token refresh failed — user must re-login")
                null
            }
        } catch (e: Exception) {
            Timber.e(e, "Exception during token refresh")
            null
        } finally {
            isRefreshing.set(false)
        }
    }
}

/** Callback interface to decouple the authenticator from the auth feature. */
fun interface TokenRefreshCallback {
    suspend fun onRefreshNeeded(): Boolean
}
