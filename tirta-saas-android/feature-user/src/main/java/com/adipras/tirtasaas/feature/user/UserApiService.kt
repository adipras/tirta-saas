package com.adipras.tirtasaas.feature.user

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface UserApiService {
    /** Returns raw array — endpoint does not use standard wrapper */
    @GET("tenant-users")
    suspend fun getUsers(): List<UserDto>

    @POST("tenant-users")
    suspend fun createUser(@Body request: CreateUserRequest): UserDto

    @PUT("tenant-users/{id}")
    suspend fun updateUser(
        @Path("id") id: String,
        @Body request: UpdateUserRequest,
    ): UserDto

    @DELETE("tenant-users/{id}")
    suspend fun deleteUser(@Path("id") id: String)
}
