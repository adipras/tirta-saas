package com.adipras.tirtasaas.feature.tenant.di

import com.adipras.tirtasaas.feature.tenant.TenantApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object TenantModule {
    @Provides
    @Singleton
    fun provideTenantApiService(retrofit: Retrofit): TenantApiService =
        retrofit.create(TenantApiService::class.java)
}
