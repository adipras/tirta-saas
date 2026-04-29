package com.adipras.tirtasaas.core.common

interface TokenProvider {
    fun getAccessToken(): String?
    fun getRefreshToken(): String?
}
