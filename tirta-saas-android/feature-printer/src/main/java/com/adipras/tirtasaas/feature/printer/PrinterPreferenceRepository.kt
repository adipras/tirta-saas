package com.adipras.tirtasaas.feature.printer

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.printerDataStore by preferencesDataStore(name = "printer_preferences")

@Singleton
class PrinterPreferenceRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val KEY_ADDRESS = stringPreferencesKey("preferred_printer_address")
        private val KEY_NAME = stringPreferencesKey("preferred_printer_name")
    }

    val preferredPrinterAddress: Flow<String?> = context.printerDataStore.data
        .map { prefs -> prefs[KEY_ADDRESS] }

    val preferredPrinterName: Flow<String?> = context.printerDataStore.data
        .map { prefs -> prefs[KEY_NAME] }

    suspend fun savePreferredPrinter(address: String, name: String) {
        context.printerDataStore.edit { prefs ->
            prefs[KEY_ADDRESS] = address
            prefs[KEY_NAME] = name
        }
    }

    suspend fun clearPreferredPrinter() {
        context.printerDataStore.edit { prefs ->
            prefs.remove(KEY_ADDRESS)
            prefs.remove(KEY_NAME)
        }
    }
}
