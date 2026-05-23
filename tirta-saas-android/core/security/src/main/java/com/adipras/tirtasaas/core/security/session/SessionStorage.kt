package com.adipras.tirtasaas.core.security.session

import android.content.SharedPreferences
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import com.adipras.tirtasaas.core.common.TokenProvider
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

data class SessionState(
    val isAuthenticated: Boolean = false,
    val tenantStatus: String? = null,
    val role: String? = null,
    val userName: String? = null,
    val tenantName: String? = null,
)

@Singleton
class SessionStorage @Inject constructor(
    private val securePreferences: SharedPreferences,
    private val dataStore: DataStore<Preferences>,
) : TokenProvider {
    val sessionState: Flow<SessionState> = dataStore.safeData.map { preferences ->
        SessionState(
            isAuthenticated = preferences[Keys.IS_AUTHENTICATED] ?: (getAccessToken() != null),
            tenantStatus = preferences[Keys.TENANT_STATUS],
            role = preferences[Keys.ROLE],
            userName = preferences[Keys.USER_NAME],
            tenantName = preferences[Keys.TENANT_NAME],
        )
    }

    val tenantStatus: Flow<String?> = dataStore.safeData.map { preferences ->
        preferences[Keys.TENANT_STATUS]
    }

    override fun getAccessToken(): String? = securePreferences.getString(Keys.ACCESS_TOKEN_NAME, null)

    override fun getRefreshToken(): String? = securePreferences.getString(Keys.REFRESH_TOKEN_NAME, null)

    suspend fun saveSession(
        accessToken: String,
        refreshToken: String?,
        tenantStatus: String?,
        role: String?,
        userName: String?,
        tenantName: String?,
    ) {
        securePreferences.edit()
            .putString(Keys.ACCESS_TOKEN_NAME, accessToken)
            .putString(Keys.REFRESH_TOKEN_NAME, refreshToken)
            .apply()

        dataStore.edit { preferences ->
            preferences[Keys.IS_AUTHENTICATED] = true
            if (tenantStatus.isNullOrBlank()) {
                preferences.remove(Keys.TENANT_STATUS)
            } else {
                preferences[Keys.TENANT_STATUS] = tenantStatus
            }
            if (role.isNullOrBlank()) {
                preferences.remove(Keys.ROLE)
            } else {
                preferences[Keys.ROLE] = role
            }
            if (userName.isNullOrBlank()) {
                preferences.remove(Keys.USER_NAME)
            } else {
                preferences[Keys.USER_NAME] = userName
            }
            if (tenantName.isNullOrBlank()) {
                preferences.remove(Keys.TENANT_NAME)
            } else {
                preferences[Keys.TENANT_NAME] = tenantName
            }
        }
    }

    suspend fun clearSession(blockedTenantStatus: String? = null) {
        securePreferences.edit().clear().apply()
        dataStore.edit { preferences ->
            preferences[Keys.IS_AUTHENTICATED] = false
            if (blockedTenantStatus.isNullOrBlank()) {
                preferences.remove(Keys.TENANT_STATUS)
            } else {
                preferences[Keys.TENANT_STATUS] = blockedTenantStatus
            }
            preferences.remove(Keys.ROLE)
            preferences.remove(Keys.USER_NAME)
            preferences.remove(Keys.TENANT_NAME)
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
        val IS_AUTHENTICATED = booleanPreferencesKey("is_authenticated")
        val TENANT_STATUS = stringPreferencesKey("tenant_status")
        val ROLE = stringPreferencesKey("role")
        val USER_NAME = stringPreferencesKey("user_name")
        val TENANT_NAME = stringPreferencesKey("tenant_name")
    }
}
