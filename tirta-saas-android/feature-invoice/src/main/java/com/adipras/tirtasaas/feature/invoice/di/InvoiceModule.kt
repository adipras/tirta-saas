package com.adipras.tirtasaas.feature.invoice.di

import com.adipras.tirtasaas.feature.invoice.InvoiceApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object InvoiceModule {
    @Provides
    @Singleton
    fun provideInvoiceApiService(retrofit: Retrofit): InvoiceApiService =
        retrofit.create(InvoiceApiService::class.java)
}
