package com.adipras.tirtasaas.feature.invoice

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class InvoiceDetailViewModel @Inject constructor(
    private val repository: InvoiceRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val invoiceId: String = checkNotNull(savedStateHandle["invoiceId"])

    private val _invoice = MutableStateFlow<InvoiceDto?>(null)
    val invoice: StateFlow<InvoiceDto?> = _invoice

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    init {
        loadInvoice()
    }

    fun loadInvoice() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            repository.getInvoice(invoiceId).onSuccess {
                _invoice.value = it
            }.onFailure {
                _error.value = it.message
            }
            _isLoading.value = false
        }
    }
}
