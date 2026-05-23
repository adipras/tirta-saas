package com.adipras.tirtasaas.feature.tenant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TenantListUiState(
    val isLoading: Boolean = false,
    val tenants: List<TenantDto> = emptyList(),
    val total: Int = 0,
    val errorMessage: String? = null,
    val searchQuery: String = "",
    val statusFilter: String? = null,
)

@HiltViewModel
class TenantListViewModel @Inject constructor(
    private val repository: TenantRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(TenantListUiState())
    val uiState: StateFlow<TenantListUiState> = _uiState.asStateFlow()

    init {
        loadTenants()
    }

    fun loadTenants() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val query = _uiState.value.searchQuery.takeIf { it.isNotBlank() }
            repository.getTenants(search = query, status = _uiState.value.statusFilter)
                .onSuccess { (tenants, total) ->
                    _uiState.update {
                        it.copy(isLoading = false, tenants = tenants, total = total)
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = error.userMessage("Gagal memuat data tenant"))
                    }
                }
        }
    }

    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadTenants()
    }

    fun onStatusFilterChange(status: String?) {
        _uiState.update { it.copy(statusFilter = status) }
        loadTenants()
    }

    fun approveTenant(id: String) {
        viewModelScope.launch {
            repository.approveTenant(id)
                .onSuccess { loadTenants() }
                .onFailure { error -> _uiState.update { it.copy(errorMessage = error.userMessage("Gagal menyetujui tenant")) } }
        }
    }

    fun suspendTenant(id: String) {
        viewModelScope.launch {
            repository.suspendTenant(id)
                .onSuccess { loadTenants() }
                .onFailure { error -> _uiState.update { it.copy(errorMessage = error.userMessage("Gagal menangguhkan tenant")) } }
        }
    }

    fun activateTenant(id: String) {
        viewModelScope.launch {
            repository.activateTenant(id)
                .onSuccess { loadTenants() }
                .onFailure { error -> _uiState.update { it.copy(errorMessage = error.userMessage("Gagal mengaktifkan tenant")) } }
        }
    }

    fun dismissError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
