package com.adipras.tirtasaas.feature.tenant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.core.network.requireData
import com.adipras.tirtasaas.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TenantSettingsUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val companyName: String = "",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    val website: String = "",
    val timezone: String = "",
    val invoiceGenerationDay: String = "",
    val invoiceDueDay: String = "",
    val saveSuccess: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class TenantSettingsViewModel @Inject constructor(
    private val tenantApiService: TenantApiService,
) : ViewModel() {

    private val _uiState = MutableStateFlow(TenantSettingsUiState())
    val uiState: StateFlow<TenantSettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
    }

    private fun loadSettings() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            runCatching { tenantApiService.getTenantSettings() }
                .onSuccess { response ->
                    val dto = response.requireData("Pengaturan tidak ditemukan")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        companyName = dto.companyName ?: "",
                        address = dto.address ?: "",
                        phone = dto.phone ?: "",
                        email = dto.email ?: "",
                        website = dto.website ?: "",
                        timezone = dto.timezone ?: "",
                        invoiceGenerationDay = dto.invoiceGenerationDay.toString(),
                        invoiceDueDay = dto.invoiceDueDay.toString(),
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.userMessage("Gagal memuat pengaturan tenant"),
                    )
                }
        }
    }

    fun onCompanyNameChange(v: String) { _uiState.value = _uiState.value.copy(companyName = v) }
    fun onAddressChange(v: String) { _uiState.value = _uiState.value.copy(address = v) }
    fun onPhoneChange(v: String) { _uiState.value = _uiState.value.copy(phone = v) }
    fun onEmailChange(v: String) { _uiState.value = _uiState.value.copy(email = v) }
    fun onWebsiteChange(v: String) { _uiState.value = _uiState.value.copy(website = v) }
    fun onTimezoneChange(v: String) { _uiState.value = _uiState.value.copy(timezone = v) }

    fun save() {
        val s = _uiState.value
        viewModelScope.launch {
            _uiState.value = s.copy(isSaving = true, error = null, saveSuccess = false)
            val request = TenantSettingsUpdateRequest(
                companyName = s.companyName.ifBlank { null },
                address = s.address.ifBlank { null },
                phone = s.phone.ifBlank { null },
                email = s.email.ifBlank { null },
                website = s.website.ifBlank { null },
                timezone = s.timezone.ifBlank { null },
            )
            runCatching { tenantApiService.updateTenantSettings(request) }
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isSaving = false, saveSuccess = true)
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        error = e.userMessage("Gagal menyimpan pengaturan tenant"),
                    )
                }
        }
    }

    fun clearSaveSuccess() {
        _uiState.value = _uiState.value.copy(saveSuccess = false)
    }
}
