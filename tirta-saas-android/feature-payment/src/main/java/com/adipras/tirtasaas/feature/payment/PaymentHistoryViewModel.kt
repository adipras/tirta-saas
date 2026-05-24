package com.adipras.tirtasaas.feature.payment

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.core.network.itemsOrEmpty
import com.adipras.tirtasaas.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PaymentHistoryUiState(
    val isLoading: Boolean = false,
    val payments: List<PaymentDto> = emptyList(),
    val currentPage: Int = 1,
    val totalPages: Int = 1,
    val errorMessage: String? = null,
)

@HiltViewModel
class PaymentHistoryViewModel @Inject constructor(
    private val repository: PaymentRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(PaymentHistoryUiState(isLoading = true))
    val uiState: StateFlow<PaymentHistoryUiState> = _uiState.asStateFlow()

    init {
        loadPayments()
    }

    fun loadPayments(page: Int = 1) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getPayments(page = page)
                .onSuccess { response ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            payments = response.itemsOrEmpty(),
                            currentPage = response.meta?.currentPage ?: 1,
                            totalPages = response.meta?.totalPages ?: 1,
                        )
                    }
                }
                .onFailure { throwable ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = throwable.userMessage("Gagal memuat riwayat pembayaran"),
                        )
                    }
                }
        }
    }

    fun refresh() = loadPayments(page = _uiState.value.currentPage)

    fun nextPage() {
        val state = _uiState.value
        if (state.currentPage < state.totalPages) {
            loadPayments(state.currentPage + 1)
        }
    }

    fun previousPage() {
        val state = _uiState.value
        if (state.currentPage > 1) {
            loadPayments(state.currentPage - 1)
        }
    }
}
