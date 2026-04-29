package com.adipras.tirtasaas.mobile.di

import com.adipras.tirtasaas.core.network.ApiConfig
import com.adipras.tirtasaas.mobile.BuildConfig
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppConfigModule {
    @Provides
    @Singleton
    fun provideApiConfig(): ApiConfig = ApiConfig(baseUrl = BuildConfig.API_BASE_URL)
}
