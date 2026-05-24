package com.adipras.tirtasaas.feature.monitoring

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

data class MonitoringUiState(
    val isLoading: Boolean = false,
    val summary: MonitoringSummary? = null,
    val errorMessage: String? = null,
)

@HiltViewModel
class MonitoringViewModel @Inject constructor(
    private val repository: MonitoringRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(MonitoringUiState(isLoading = true))
    val uiState: StateFlow<MonitoringUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getSummary()
                .onSuccess { summary ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            summary = summary,
                            errorMessage = null,
                        )
                    }
                }
                .onFailure { throwable ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            errorMessage = throwable.userMessage("Gagal memuat monitoring operasional"),
                        )
                    }
                }
        }
    }
}
