package com.adipras.tirtasaas.feature.customer.di

import com.adipras.tirtasaas.feature.customer.CustomerApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object CustomerModule {
    @Provides
    @Singleton
    fun provideCustomerApiService(retrofit: Retrofit): CustomerApiService =
        retrofit.create(CustomerApiService::class.java)
}
