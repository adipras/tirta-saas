package com.adipras.tirtasaas.core.database.di

import android.content.Context
import androidx.room.Room
import com.adipras.tirtasaas.core.database.TirtaDatabase
import com.adipras.tirtasaas.core.database.MIGRATION_3_4
import com.adipras.tirtasaas.core.database.MIGRATION_4_5
import com.adipras.tirtasaas.core.database.dao.CustomerDao
import com.adipras.tirtasaas.core.database.dao.DraftUsageDao
import com.adipras.tirtasaas.core.database.dao.SyncQueueDao
import com.adipras.tirtasaas.core.database.dao.TenantSettingsDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideTirtaDatabase(
        @ApplicationContext context: Context,
    ): TirtaDatabase = Room.databaseBuilder(
        context,
        TirtaDatabase::class.java,
        "tirta_mobile.db",
    ).addMigrations(MIGRATION_3_4, MIGRATION_4_5).fallbackToDestructiveMigration().build()

    @Provides
    fun provideSyncQueueDao(database: TirtaDatabase): SyncQueueDao = database.syncQueueDao()

    @Provides
    fun provideTenantSettingsDao(database: TirtaDatabase): TenantSettingsDao = database.tenantSettingsDao()

    @Provides
    fun provideDraftUsageDao(database: TirtaDatabase): DraftUsageDao = database.draftUsageDao()

    @Provides
    fun provideCustomerDao(database: TirtaDatabase): CustomerDao = database.customerDao()
}
