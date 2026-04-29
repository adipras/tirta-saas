package com.adipras.tirtasaas.core.security.session

import android.content.SharedPreferences
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionStorage @Inject constructor(
    private val securePreferences: SharedPreferences,
    private val dataStore: DataStore<Preferences>,
) {
    val tenantStatus: Flow<String?> = dataStore.safeData.map { preferences ->
        preferences[Keys.TENANT_STATUS]
    }

    fun getAccessToken(): String? = securePreferences.getString(Keys.ACCESS_TOKEN_NAME, null)

    fun getRefreshToken(): String? = securePreferences.getString(Keys.REFRESH_TOKEN_NAME, null)

    suspend fun saveSession(
        accessToken: String,
        refreshToken: String?,
        tenantStatus: String?,
    ) {
        securePreferences.edit()
            .putString(Keys.ACCESS_TOKEN_NAME, accessToken)
            .putString(Keys.REFRESH_TOKEN_NAME, refreshToken)
            .apply()

        dataStore.edit { preferences ->
            if (tenantStatus.isNullOrBlank()) {
                preferences.remove(Keys.TENANT_STATUS)
            } else {
                preferences[Keys.TENANT_STATUS] = tenantStatus
            }
        }
    }

    suspend fun clearSession() {
        securePreferences.edit().clear().apply()
        dataStore.edit { preferences ->
            preferences.remove(Keys.TENANT_STATUS)
        }
    }

    private val DataStore<Preferences>.safeData: Flow<Preferences>
        get() = data.catch { throwable ->
            if (throwable is IOException) {
                emit(emptyPreferences())
            } else {
                throw throwable
            }
        }

    private object Keys {
        const val ACCESS_TOKEN_NAME = "access_token"
        const val REFRESH_TOKEN_NAME = "refresh_token"
        val TENANT_STATUS = stringPreferencesKey("tenant_status")
    }
}
