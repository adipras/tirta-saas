package com.adipras.tirtasaas.feature.auth

import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("auth/refresh")
    suspend fun refresh(@Body request: RefreshRequest): LoginResponse

    @POST("auth/logout")
    suspend fun logout()
}
