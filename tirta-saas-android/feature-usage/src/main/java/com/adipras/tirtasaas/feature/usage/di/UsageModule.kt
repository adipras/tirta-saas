package com.adipras.tirtasaas.feature.usage.di

import com.adipras.tirtasaas.feature.usage.UsageApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object UsageModule {
    @Provides
    @Singleton
    fun provideUsageApiService(retrofit: Retrofit): UsageApiService =
        retrofit.create(UsageApiService::class.java)
}
