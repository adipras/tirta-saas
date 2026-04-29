package com.adipras.tirtasaas.feature.user

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepository @Inject constructor(
    private val userApiService: UserApiService,
) {
    suspend fun getUsers(): Result<List<UserDto>> = runCatching {
        userApiService.getUsers()
    }

    suspend fun createUser(request: CreateUserRequest): Result<UserDto> = runCatching {
        userApiService.createUser(request)
    }

    suspend fun updateUser(id: String, request: UpdateUserRequest): Result<UserDto> = runCatching {
        userApiService.updateUser(id, request)
    }

    suspend fun deleteUser(id: String): Result<Unit> = runCatching {
        userApiService.deleteUser(id)
    }
}
