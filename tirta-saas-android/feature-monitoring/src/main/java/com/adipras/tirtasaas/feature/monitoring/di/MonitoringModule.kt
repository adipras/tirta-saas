package com.adipras.tirtasaas.feature.monitoring.di

import com.adipras.tirtasaas.feature.monitoring.MonitoringApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import retrofit2.Retrofit

@Module
@InstallIn(SingletonComponent::class)
object MonitoringModule {
    @Provides
    @Singleton
    fun provideMonitoringApiService(retrofit: Retrofit): MonitoringApiService =
        retrofit.create(MonitoringApiService::class.java)
}
