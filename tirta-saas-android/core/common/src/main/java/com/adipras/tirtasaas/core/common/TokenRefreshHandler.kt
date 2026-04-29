package com.adipras.tirtasaas.core.common

interface TokenRefreshHandler {
    /**
     * Called when a 401 is received. Should attempt to refresh the access token.
     * Returns true if refresh succeeded (request should be retried), false otherwise.
     */
    suspend fun refreshToken(): Boolean
}
