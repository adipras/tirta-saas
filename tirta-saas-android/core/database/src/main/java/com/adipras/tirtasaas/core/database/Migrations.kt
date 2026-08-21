package com.adipras.tirtasaas.core.database

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/**
 * Migration 3 → 4: tambah kolom meter_id ke tabel draft_usages.
 * Kolom nullable (tidak ada DEFAULT) agar baris lama tetap valid.
 */
val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE draft_usages ADD COLUMN meter_id TEXT")
    }
}

/**
 * Migration 4 → 5: tambah tabel cached_customers dan cached_meters untuk offline customer caching.
 */
val MIGRATION_4_5 = object : Migration(4, 5) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS cached_customers (
                id TEXT NOT NULL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL DEFAULT '',
                phone TEXT NOT NULL DEFAULT '',
                address TEXT NOT NULL DEFAULT '',
                subscription_id TEXT NOT NULL DEFAULT '',
                subscription_name TEXT NOT NULL DEFAULT '',
                service_area_id TEXT,
                service_area_name TEXT,
                reading_route_id TEXT,
                reading_route_name TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                updated_at INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent(),
        )

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS cached_meters (
                id TEXT NOT NULL PRIMARY KEY,
                customer_id TEXT NOT NULL,
                meter_number TEXT NOT NULL,
                location_name TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                subscription_type_id TEXT,
                subscription_type_name TEXT,
                install_date TEXT NOT NULL DEFAULT '',
                initial_reading REAL NOT NULL DEFAULT 0.0,
                latest_usage_month TEXT,
                latest_meter_end REAL,
                FOREIGN KEY(customer_id) REFERENCES cached_customers(id) ON DELETE CASCADE
            )
            """.trimIndent(),
        )

        db.execSQL("CREATE INDEX IF NOT EXISTS index_cached_meters_customer_id ON cached_meters(customer_id)")
        db.execSQL("CREATE INDEX IF NOT EXISTS index_cached_meters_meter_number ON cached_meters(meter_number)")
    }
}
