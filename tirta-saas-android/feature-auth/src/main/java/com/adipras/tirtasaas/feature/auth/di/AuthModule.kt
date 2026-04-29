package com.adipras.tirtasaas.feature.auth.di

import com.adipras.tirtasaas.core.network.TokenRefreshCallback
import com.adipras.tirtasaas.feature.auth.AuthApiService
import com.adipras.tirtasaas.feature.auth.AuthRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class AuthModule {

    @Binds
    @Singleton
    abstract fun bindTokenRefreshCallback(authRepository: AuthRepository): TokenRefreshCallback

    companion object {
        @Provides
        @Singleton
        fun provideAuthApiService(retrofit: Retrofit): AuthApiService =
            retrofit.create(AuthApiService::class.java)
    }
}
