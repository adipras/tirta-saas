package com.adipras.tirtasaas.feature.customer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
)

@HiltViewModel
class CustomerListViewModel @Inject constructor(
    private val repository: CustomerRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CustomerListUiState())
    val uiState: StateFlow<CustomerListUiState> = _uiState.asStateFlow()

    init {
        loadCustomers()
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
                        it.copy(isLoading = false, errorMessage = error.message ?: "Gagal memuat data pelanggan")
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

    fun toggleActive(customer: CustomerDto) {
        viewModelScope.launch {
            repository.setActive(customer.id, !customer.isActive)
                .onSuccess { loadCustomers(reset = true) }
                .onFailure { error ->
                    _uiState.update { it.copy(errorMessage = error.message) }
                }
        }
    }
}
