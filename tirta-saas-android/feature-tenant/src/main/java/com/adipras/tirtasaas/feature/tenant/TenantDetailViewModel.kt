package com.adipras.tirtasaas.feature.tenant

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class TenantDetailUiState(
    val isLoading: Boolean = false,
    val tenant: TenantDto? = null,
    val errorMessage: String? = null,
    val isSaving: Boolean = false,
    val showEditDialog: Boolean = false,
    val showRejectDialog: Boolean = false,
    val showDeleteConfirm: Boolean = false,
    val deleteSuccess: Boolean = false,
)

@HiltViewModel
class TenantDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: TenantRepository,
) : ViewModel() {

    private val tenantId: String = checkNotNull(savedStateHandle[TenantDetailDestination.ARG])

    private val _uiState = MutableStateFlow(TenantDetailUiState())
    val uiState: StateFlow<TenantDetailUiState> = _uiState.asStateFlow()

    init {
        loadTenant()
    }

    fun loadTenant() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getTenant(tenantId)
                .onSuccess { tenant ->
                    _uiState.update { it.copy(isLoading = false, tenant = tenant) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = error.userMessage("Gagal memuat detail tenant"),
                        )
                    }
                }
        }
    }

    fun showEditDialog() = _uiState.update { it.copy(showEditDialog = true) }

    fun dismissEditDialog() = _uiState.update { it.copy(showEditDialog = false) }

    fun showRejectDialog() = _uiState.update { it.copy(showRejectDialog = true) }

    fun dismissRejectDialog() = _uiState.update { it.copy(showRejectDialog = false) }

    fun showDeleteConfirm() = _uiState.update { it.copy(showDeleteConfirm = true) }

    fun dismissDeleteConfirm() = _uiState.update { it.copy(showDeleteConfirm = false) }

    fun dismissError() = _uiState.update { it.copy(errorMessage = null) }

    fun saveEdit(
        name: String,
        email: String,
        phone: String,
        address: String,
        notes: String,
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.updateTenant(
                id = tenantId,
                request = UpdateTenantRequest(
                    name = name,
                    email = email,
                    phone = phone,
                    address = address,
                    notes = notes,
                ),
            ).onSuccess { tenant ->
                _uiState.update {
                    it.copy(
                        isSaving = false,
                        tenant = tenant,
                        showEditDialog = false,
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        isSaving = false,
                        errorMessage = error.userMessage("Gagal memperbarui tenant"),
                    )
                }
            }
        }
    }

    fun approveTenant() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.approveTenant(tenantId)
                .onSuccess { tenant ->
                    _uiState.update { it.copy(isSaving = false, tenant = tenant) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            errorMessage = error.userMessage("Gagal menyetujui tenant"),
                        )
                    }
                }
        }
    }

    fun rejectTenant(reason: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.rejectTenant(tenantId, reason)
                .onSuccess { tenant ->
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            tenant = tenant,
                            showRejectDialog = false,
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            errorMessage = error.userMessage("Gagal menolak tenant"),
                        )
                    }
                }
        }
    }

    fun suspendTenant() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.suspendTenant(tenantId)
                .onSuccess { tenant ->
                    _uiState.update { it.copy(isSaving = false, tenant = tenant) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            errorMessage = error.userMessage("Gagal menangguhkan tenant"),
                        )
                    }
                }
        }
    }

    fun activateTenant() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.activateTenant(tenantId)
                .onSuccess { tenant ->
                    _uiState.update { it.copy(isSaving = false, tenant = tenant) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            errorMessage = error.userMessage("Gagal mengaktifkan tenant"),
                        )
                    }
                }
        }
    }

    fun deleteTenant() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.deleteTenant(tenantId)
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            showDeleteConfirm = false,
                            deleteSuccess = true,
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            errorMessage = error.userMessage("Gagal menghapus tenant"),
                        )
                    }
                }
        }
    }
}
