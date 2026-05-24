package com.adipras.tirtasaas.feature.usage

import android.content.Context
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import com.adipras.tirtasaas.core.database.entity.DraftUsageEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.util.UUID
import java.util.concurrent.TimeUnit
import javax.inject.Inject

data class UsageFormUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val usageId: String? = null,
    val customerId: String = "",
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
                            usageMonth = s.usageMonth,
                            meterEnd = meterEndVal,
                            notes = s.notes.ifBlank { null },
                            isSynced = false,
                            createdAt = Instant.now().toString(),
                        ),
                    )
                    enqueueDraftSync(draftId)
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

    private fun enqueueDraftSync(draftId: String) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val request = OneTimeWorkRequestBuilder<DraftUsageSyncWorker>()
            .setInputData(workDataOf("draft_id" to draftId))
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(appContext).enqueueUniqueWork(
            "draft-sync-$draftId",
            ExistingWorkPolicy.REPLACE,
            request,
        )
    }
}
