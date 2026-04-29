package com.adipras.tirtasaas.mobile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.core.security.session.SessionStorage
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AppSessionUiState(
    val isAuthenticated: Boolean = false,
    val tenantStatus: String? = null,
) {
    val isTenantBlocked: Boolean
        get() = tenantStatus?.uppercase() in blockedTenantStatuses
}

private val blockedTenantStatuses = setOf("SUSPENDED", "EXPIRED")

@HiltViewModel
class AppSessionViewModel @Inject constructor(
    private val authRepository: com.adipras.tirtasaas.feature.auth.AuthRepository,
    sessionStorage: SessionStorage,
) : ViewModel() {

    private val _uiState = MutableStateFlow(AppSessionUiState())
    val uiState: StateFlow<AppSessionUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            sessionStorage.sessionState.collect { sessionState ->
                _uiState.update {
                    it.copy(
                        isAuthenticated = sessionState.isAuthenticated,
                        tenantStatus = sessionState.tenantStatus,
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }

    fun clearBlockedSession() {
        viewModelScope.launch {
            authRepository.clearLocalSession()
        }
    }
}
