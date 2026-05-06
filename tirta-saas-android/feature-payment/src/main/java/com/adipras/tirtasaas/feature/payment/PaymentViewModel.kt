package com.adipras.tirtasaas.feature.payment

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PaymentViewModel @Inject constructor(
    private val repository: PaymentRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    val invoiceId: String = checkNotNull(savedStateHandle["invoiceId"])

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _success = MutableStateFlow(false)
    val success: StateFlow<Boolean> = _success

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun submitPayment(amount: Double, paymentMethod: String, notes: String?) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            repository.createPayment(invoiceId, amount, paymentMethod, notes)
                .onSuccess { _success.value = true }
                .onFailure { _error.value = it.message }
            _isLoading.value = false
        }
    }
}
