package com.adipras.tirtasaas.feature.invoice

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.core.network.itemsOrEmpty
import com.adipras.tirtasaas.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class InvoiceListViewModel @Inject constructor(
    private val repository: InvoiceRepository,
) : ViewModel() {

    private val _invoices = MutableStateFlow<List<InvoiceDto>>(emptyList())
    val invoices: StateFlow<List<InvoiceDto>> = _invoices

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _currentPage = MutableStateFlow(1)
    val currentPage: StateFlow<Int> = _currentPage

    private val _totalPages = MutableStateFlow(1)
    val totalPages: StateFlow<Int> = _totalPages

    var filterCustomerId: String? = null
    var filterUsageMonth: String? = null
    var filterStatus: String? = null

    init {
        loadInvoices()
    }

    fun loadInvoices(page: Int = 1) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            repository.getInvoices(
                page = page,
                customerId = filterCustomerId,
                usageMonth = filterUsageMonth,
                status = filterStatus,
            ).onSuccess { response ->
                _invoices.value = response.itemsOrEmpty()
                _currentPage.value = response.meta?.currentPage ?: 1
                _totalPages.value = response.meta?.totalPages ?: 1
            }.onFailure {
                _error.value = it.userMessage("Gagal memuat daftar tagihan")
            }
            _isLoading.value = false
        }
    }

    fun nextPage() {
        if (_currentPage.value < _totalPages.value) loadInvoices(_currentPage.value + 1)
    }

    fun prevPage() {
        if (_currentPage.value > 1) loadInvoices(_currentPage.value - 1)
    }

    fun applyFilters(customerId: String?, usageMonth: String?, status: String?) {
        filterCustomerId = customerId
        filterUsageMonth = usageMonth
        filterStatus = status
        loadInvoices()
    }
}
