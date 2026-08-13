package com.adipras.tirtasaas.feature.usage

import android.content.Context
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.core.database.entity.DraftUsageEntity
import com.adipras.tirtasaas.feature.customer.CustomerDto
import com.adipras.tirtasaas.feature.customer.MeterDto
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.util.UUID
import javax.inject.Inject

data class UsageFormUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val usageId: String? = null,
    val customerId: String = "",
    // Customer search combobox
    val customerSearchQuery: String = "",
    val customerSuggestions: List<CustomerDto> = emptyList(),
    val selectedCustomerName: String = "",
    val isSearchingCustomers: Boolean = false,
    // Meter selection — populated after customer is selected
    val customerMeters: List<MeterDto> = emptyList(),
    val selectedMeterId: String = "",
    val meterStartValue: Double? = null,
    val meterStartDescription: String = "",
    val usageMonth: String = "",
    val meterEnd: String = "",
    val notes: String = "",
    val photoUrl: String = "",
    val isUploadingPhoto: Boolean = false,
    val isDraft: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class UsageFormViewModel @Inject constructor(
    private val repository: UsageRepository,
    private val draftUsageRepository: DraftUsageRepository,
    @ApplicationContext private val appContext: Context,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val _uiState = MutableStateFlow(UsageFormUiState())
    val uiState: StateFlow<UsageFormUiState> = _uiState.asStateFlow()

    private val usageId: String? = savedStateHandle["usageId"]
    private var searchJob: Job? = null

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
                    photoUrl = usage.photoUrl,
                    isDraft = usage.isDraft,
                )
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun onCustomerSearchChange(query: String) {
        _uiState.value = _uiState.value.copy(
            customerSearchQuery = query,
            selectedCustomerName = "",
            customerId = "",
            customerMeters = emptyList(),
            selectedMeterId = "",
            meterStartValue = null,
        )
        searchJob?.cancel()
        if (query.isBlank()) {
            _uiState.value = _uiState.value.copy(customerSuggestions = emptyList())
            return
        }
        searchJob = viewModelScope.launch {
            delay(300)
            _uiState.value = _uiState.value.copy(isSearchingCustomers = true)
            repository.searchCustomers(query).onSuccess { customers ->
                _uiState.value = _uiState.value.copy(
                    customerSuggestions = customers,
                    isSearchingCustomers = false,
                )
            }.onFailure {
                _uiState.value = _uiState.value.copy(isSearchingCustomers = false)
            }
        }
    }

    fun onCustomerSelected(customer: CustomerDto) {
        val primaryMeter = customer.meters.firstOrNull()
        val label = buildString {
            append(customer.name)
            if (primaryMeter != null) {
                append(" — ${primaryMeter.meterNumber}")
                if (!primaryMeter.locationName.isNullOrBlank()) append(" (${primaryMeter.locationName})")
            }
        }
        _uiState.value = _uiState.value.copy(
            customerId = customer.id,
            customerSearchQuery = label,
            selectedCustomerName = label,
            customerSuggestions = emptyList(),
            customerMeters = emptyList(),
            selectedMeterId = "",
            meterStartValue = null,
        )
        loadCustomerMeters(customer.id)
    }

    fun onCustomerIdChange(v: String) {
        _uiState.value = _uiState.value.copy(customerId = v, customerMeters = emptyList(), selectedMeterId = "", meterStartValue = null)
        if (v.isNotBlank()) loadCustomerMeters(v)
    }

    fun onMeterSelected(meterId: String) {
        _uiState.value = _uiState.value.copy(selectedMeterId = meterId)
        val month = _uiState.value.usageMonth
        if (meterId.isNotBlank() && month.isNotBlank()) resolveMeterStart(meterId, month)
    }

    fun onUsageMonthChange(v: String) {
        _uiState.value = _uiState.value.copy(usageMonth = v)
        val meterId = _uiState.value.selectedMeterId
        if (meterId.isNotBlank() && v.isNotBlank()) resolveMeterStart(meterId, v)
    }

    fun onMeterEndChange(v: String) { _uiState.value = _uiState.value.copy(meterEnd = v) }
    fun onNotesChange(v: String) { _uiState.value = _uiState.value.copy(notes = v) }
    fun onDraftChange(v: Boolean) { _uiState.value = _uiState.value.copy(isDraft = v) }

    private fun loadCustomerMeters(customerId: String) {
        viewModelScope.launch {
            repository.getCustomerMeters(customerId).onSuccess { meters ->
                val autoSelect = if (meters.size == 1) meters[0].id else ""
                _uiState.value = _uiState.value.copy(customerMeters = meters, selectedMeterId = autoSelect)
                if (autoSelect.isNotBlank()) {
                    val month = _uiState.value.usageMonth
                    if (month.isNotBlank()) resolveMeterStart(autoSelect, month)
                }
            }
        }
    }

    private fun resolveMeterStart(meterId: String, usageMonth: String) {
        viewModelScope.launch {
            repository.resolveMeterStart(meterId, usageMonth).onSuccess { resolution ->
                _uiState.value = _uiState.value.copy(
                    meterStartValue = resolution.value,
                    meterStartDescription = resolution.description,
                )
            }
        }
    }

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
        if (!USAGE_MONTH_REGEX.matches(s.usageMonth)) {
            _uiState.value = s.copy(error = "Format bulan tidak valid. Gunakan YYYY-MM")
            return
        }
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null)
            val result = if (s.usageId == null) {
                repository.createUsage(
                    CreateWaterUsageRequest(
                        customerId = s.customerId,
                        meterId = s.selectedMeterId.ifBlank { null },
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
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    usageId = it.id,
                    photoUrl = it.photoUrl,
                    saveSuccess = true,
                )
            }.onFailure { e ->
                if (s.usageId == null && s.isDraft) {
                    val draftId = UUID.randomUUID().toString()
                    draftUsageRepository.saveDraft(
                        DraftUsageEntity(
                            id = draftId,
                            customerId = s.customerId,
                            meterId = s.selectedMeterId.ifBlank { null },
                            usageMonth = s.usageMonth,
                            meterEnd = meterEndVal,
                            notes = s.notes.ifBlank { null },
                            isSynced = false,
                            createdAt = Instant.now().toString(),
                        ),
                    )
                    DraftSyncScheduler.enqueue(appContext, draftId)
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        saveSuccess = true,
                        error = "Koneksi server bermasalah. Draft disimpan lokal dan akan disinkronkan otomatis.",
                    )
                } else {
                    _uiState.value = _uiState.value.copy(isSaving = false, error = e.message)
                }
            }
        }
    }

    fun uploadPhoto(
        fileName: String,
        mimeType: String,
        bytes: ByteArray,
    ) {
        val currentUsageId = _uiState.value.usageId
        if (currentUsageId.isNullOrBlank()) {
            _uiState.value = _uiState.value.copy(error = "Simpan data pemakaian terlebih dahulu sebelum upload foto")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUploadingPhoto = true, error = null)
            repository.uploadUsagePhoto(
                id = currentUsageId,
                fileName = fileName,
                mimeType = mimeType,
                bytes = bytes,
            )
                .onSuccess { usage ->
                    _uiState.value = _uiState.value.copy(
                        isUploadingPhoto = false,
                        photoUrl = usage.photoUrl,
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isUploadingPhoto = false,
                        error = e.message ?: "Gagal upload foto meter",
                    )
                }
        }
    }

    fun onPhotoReadFailed(message: String) {
        _uiState.value = _uiState.value.copy(error = message)
    }

    companion object {
        private val USAGE_MONTH_REGEX = Regex("""^\d{4}-(0[1-9]|1[0-2])$""")
    }
}
