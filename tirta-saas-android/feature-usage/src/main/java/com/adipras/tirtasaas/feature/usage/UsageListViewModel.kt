package com.adipras.tirtasaas.feature.usage

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UsageListUiState(
    val isLoading: Boolean = false,
    val usages: List<WaterUsageDto> = emptyList(),
    val currentPage: Int = 1,
    val totalPages: Int = 1,
    val filterMonth: String? = null,
    val filterCustomerId: String? = null,
    val error: String? = null,
)

@HiltViewModel
class UsageListViewModel @Inject constructor(
    private val repository: UsageRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(UsageListUiState())
    val uiState: StateFlow<UsageListUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load(page: Int = 1) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            repository.getUsages(
                page = page,
                customerId = _uiState.value.filterCustomerId,
                usageMonth = _uiState.value.filterMonth,
            ).onSuccess { paged ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    usages = paged.data ?: emptyList(),
                    currentPage = paged.meta?.currentPage ?: 1,
                    totalPages = paged.meta?.totalPages ?: 1,
                )
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun applyFilter(month: String?, customerId: String?) {
        _uiState.value = _uiState.value.copy(filterMonth = month, filterCustomerId = customerId)
        load(page = 1)
    }

    fun nextPage() {
        val s = _uiState.value
        if (s.currentPage < s.totalPages) load(s.currentPage + 1)
    }

    fun prevPage() {
        val s = _uiState.value
        if (s.currentPage > 1) load(s.currentPage - 1)
    }
}
