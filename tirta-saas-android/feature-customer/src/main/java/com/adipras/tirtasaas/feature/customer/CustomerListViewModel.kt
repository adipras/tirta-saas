package com.adipras.tirtasaas.feature.customer

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

data class CustomerListUiState(
    val isLoading: Boolean = false,
    val customers: List<CustomerDto> = emptyList(),
    val total: Int = 0,
    val errorMessage: String? = null,
    val searchQuery: String = "",
    val currentPage: Int = 1,
    val isSaving: Boolean = false,
    val showCreateDialog: Boolean = false,
    val subscriptionTypes: List<SubscriptionTypeDto> = emptyList(),
)

@HiltViewModel
class CustomerListViewModel @Inject constructor(
    private val repository: CustomerRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CustomerListUiState())
    val uiState: StateFlow<CustomerListUiState> = _uiState.asStateFlow()

    init {
        loadCustomers()
        loadSubscriptionTypes()
    }

    fun loadCustomers(page: Int = 1, reset: Boolean = true) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val query = _uiState.value.searchQuery.takeIf { it.isNotBlank() }
            repository.getCustomers(page = page, search = query)
                .onSuccess { response ->
                    val newList = if (reset) response.customers
                    else _uiState.value.customers + response.customers
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            customers = newList,
                            total = response.total,
                            currentPage = page,
                        )
                    }
                }                .onFailure { error ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = error.userMessage("Gagal memuat data pelanggan"))
                    }
                }
        }
    }

    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadCustomers(reset = true)
    }

    fun retry() = loadCustomers()

    fun dismissError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun showCreateDialog() {
        if (_uiState.value.subscriptionTypes.isEmpty()) {
            loadSubscriptionTypes()
        }
        _uiState.update { it.copy(showCreateDialog = true) }
    }

    fun dismissCreateDialog() {
        _uiState.update { it.copy(showCreateDialog = false) }
    }

    fun createCustomer(request: CreateCustomerRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, errorMessage = null) }
            repository.createCustomer(request)
                .onSuccess {
                    loadCustomers(reset = true)
                    _uiState.update { state ->
                        state.copy(
                            isSaving = false,
                            showCreateDialog = false,
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            errorMessage = error.userMessage("Gagal membuat pelanggan"),
                        )
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
                .onFailure { error ->
                    _uiState.update {
                        it.copy(errorMessage = error.userMessage("Gagal memuat paket langganan"))
                    }
                }
        }
    }

    fun toggleActive(customer: CustomerDto) {
        viewModelScope.launch {
            repository.setActive(customer.id, !customer.isActive)
                .onSuccess { loadCustomers(reset = true) }
                .onFailure { error ->
                    _uiState.update { it.copy(errorMessage = error.userMessage("Gagal mengubah status pelanggan")) }
                }
        }
    }
}
