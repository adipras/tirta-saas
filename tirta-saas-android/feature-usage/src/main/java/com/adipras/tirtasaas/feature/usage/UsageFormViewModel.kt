package com.adipras.tirtasaas.feature.usage

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UsageFormUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val usageId: String? = null,
    val customerId: String = "",
    val usageMonth: String = "",
    val meterEnd: String = "",
    val notes: String = "",
    val isDraft: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class UsageFormViewModel @Inject constructor(
    private val repository: UsageRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val _uiState = MutableStateFlow(UsageFormUiState())
    val uiState: StateFlow<UsageFormUiState> = _uiState.asStateFlow()

    private val usageId: String? = savedStateHandle["usageId"]

    init {
        if (usageId != null) loadExisting(usageId)
    }

    private fun loadExisting(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            repository.getUsageById(id).onSuccess { usage ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    usageId = usage.id,
                    customerId = usage.customerId,
                    usageMonth = usage.usageMonth,
                    meterEnd = usage.meterEnd.toString(),
                    isDraft = usage.isDraft,
                )
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun onCustomerIdChange(v: String) { _uiState.value = _uiState.value.copy(customerId = v) }
    fun onUsageMonthChange(v: String) { _uiState.value = _uiState.value.copy(usageMonth = v) }
    fun onMeterEndChange(v: String) { _uiState.value = _uiState.value.copy(meterEnd = v) }
    fun onNotesChange(v: String) { _uiState.value = _uiState.value.copy(notes = v) }
    fun onDraftChange(v: Boolean) { _uiState.value = _uiState.value.copy(isDraft = v) }

    fun save() {
        val s = _uiState.value
        val meterEndVal = s.meterEnd.toDoubleOrNull() ?: run {
            _uiState.value = s.copy(error = "Nilai meter tidak valid")
            return
        }
        if (s.customerId.isBlank() || s.usageMonth.isBlank()) {
            _uiState.value = s.copy(error = "Customer dan bulan wajib diisi")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null)
            val result = if (s.usageId == null) {
                repository.createUsage(
                    CreateWaterUsageRequest(
                        customerId = s.customerId,
                        usageMonth = s.usageMonth,
                        meterEnd = meterEndVal,
                        notes = s.notes.ifBlank { null },
                        isDraft = s.isDraft,
                    )
                )
            } else {
                repository.updateUsage(
                    s.usageId,
                    UpdateWaterUsageRequest(meterEnd = meterEndVal, notes = s.notes.ifBlank { null }),
                )
            }
            result.onSuccess {
                _uiState.value = _uiState.value.copy(isSaving = false, saveSuccess = true)
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(isSaving = false, error = e.message)
            }
        }
    }
}
