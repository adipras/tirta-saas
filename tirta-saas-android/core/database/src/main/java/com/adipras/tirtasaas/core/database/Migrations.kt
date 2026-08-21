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
