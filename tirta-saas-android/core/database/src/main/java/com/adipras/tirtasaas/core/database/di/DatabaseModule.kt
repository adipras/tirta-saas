package com.adipras.tirtasaas.core.database.di

import android.content.Context
import androidx.room.Room
import com.adipras.tirtasaas.core.database.TirtaDatabase
import com.adipras.tirtasaas.core.database.dao.SyncQueueDao
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
    ).fallbackToDestructiveMigration().build()

    @Provides
    fun provideSyncQueueDao(database: TirtaDatabase): SyncQueueDao = database.syncQueueDao()
}
