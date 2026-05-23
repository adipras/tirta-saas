package com.adipras.tirtasaas.feature.customer

import androidx.lifecycle.SavedStateHandle
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

data class CustomerDetailUiState(
    val isLoading: Boolean = false,
    val customer: CustomerDto? = null,
    val errorMessage: String? = null,
    val isSaving: Boolean = false,
    val showEditDialog: Boolean = false,
    val showDeleteConfirm: Boolean = false,
    val subscriptionTypes: List<SubscriptionTypeDto> = emptyList(),
    val deleteSuccess: Boolean = false,
)

@HiltViewModel
class CustomerDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: CustomerRepository,
) : ViewModel() {

    private val customerId: String = checkNotNull(savedStateHandle["customerId"])

    private val _uiState = MutableStateFlow(CustomerDetailUiState())
    val uiState: StateFlow<CustomerDetailUiState> = _uiState.asStateFlow()

    init {
        loadCustomer()
        loadSubscriptionTypes()
    }

    fun loadCustomer() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getCustomer(customerId)
                .onSuccess { customer ->
                    _uiState.update { it.copy(isLoading = false, customer = customer) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = error.userMessage("Gagal memuat detail pelanggan"))
                    }
                }
        }
    }

    private fun loadSubscriptionTypes() {
        viewModelScope.launch {
            repository.getSubscriptionTypes()
                .onSuccess { types ->
                    _uiState.update { it.copy(subscriptionTypes = types) }
                }
                .onFailure { /* non-critical */ }
        }
    }

    fun showEditDialog() = _uiState.update { it.copy(showEditDialog = true) }
    fun dismissEditDialog() = _uiState.update { it.copy(showEditDialog = false) }
    fun showDeleteConfirm() = _uiState.update { it.copy(showDeleteConfirm = true) }
    fun dismissDeleteConfirm() = _uiState.update { it.copy(showDeleteConfirm = false) }
    fun dismissError() = _uiState.update { it.copy(errorMessage = null) }

    fun saveEdit(
        name: String,
        email: String,
        phone: String,
        address: String,
        subscriptionId: String,
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.updateCustomer(customerId, UpdateCustomerRequest(name, email, phone, address, subscriptionId))
                .onSuccess { updated ->
                    _uiState.update { it.copy(isSaving = false, customer = updated, showEditDialog = false) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(isSaving = false, errorMessage = error.userMessage("Gagal memperbarui pelanggan"))
                    }
                }
        }
    }

    fun confirmDelete() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.deleteCustomer(customerId)
                .onSuccess {
                    _uiState.update { it.copy(isSaving = false, showDeleteConfirm = false, deleteSuccess = true) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(isSaving = false, errorMessage = error.userMessage("Gagal menghapus pelanggan"))
                    }
                }
        }
    }

    fun toggleActive() {
        val current = _uiState.value.customer ?: return
        viewModelScope.launch {
            repository.setActive(customerId, !current.isActive)
                .onSuccess { updated ->
                    _uiState.update { it.copy(customer = updated) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(errorMessage = error.userMessage("Gagal mengubah status pelanggan"))
                    }
                }
        }
    }
}
