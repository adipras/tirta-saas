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

private val Context.printerDataStore by preferencesDataStore(name = "printer_prefs")
private val KEY_ADDRESS = stringPreferencesKey("preferred_printer_address")
private val KEY_NAME    = stringPreferencesKey("preferred_printer_name")

@Singleton
class PrinterPreferenceRepository @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    val preferredAddress: Flow<String?> = context.printerDataStore.data.map { it[KEY_ADDRESS] }
    val preferredName: Flow<String?> = context.printerDataStore.data.map { it[KEY_NAME] }

    suspend fun save(address: String, name: String) {
        context.printerDataStore.edit { prefs ->
            prefs[KEY_ADDRESS] = address
            prefs[KEY_NAME] = name
        }
    }

    suspend fun clear() {
        context.printerDataStore.edit { prefs ->
            prefs.remove(KEY_ADDRESS)
            prefs.remove(KEY_NAME)
        }
    }
}
