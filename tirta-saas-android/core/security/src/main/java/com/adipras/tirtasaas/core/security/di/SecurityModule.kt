package com.adipras.tirtasaas.core.security.di

import com.adipras.tirtasaas.core.common.TokenProvider
import com.adipras.tirtasaas.core.security.session.SessionStorage
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class SecurityModule {
    @Binds
    @Singleton
    abstract fun bindTokenProvider(sessionStorage: SessionStorage): TokenProvider
}
