package com.adipras.tirtasaas.feature.usage

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.core.network.itemsOrEmpty
import com.adipras.tirtasaas.core.network.userMessage
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UsageListUiState(
    val isLoading: Boolean = false,
    val isSyncingDrafts: Boolean = false,
    val usages: List<WaterUsageDto> = emptyList(),
    val pendingDraftCount: Int = 0,
    val currentPage: Int = 1,
    val totalPages: Int = 1,
    val filterMonth: String? = null,
    val filterCustomerId: String? = null,
    val notice: String? = null,
    val error: String? = null,
)

@HiltViewModel
class UsageListViewModel @Inject constructor(
    private val repository: UsageRepository,
    private val draftUsageRepository: DraftUsageRepository,
    @ApplicationContext private val appContext: Context,
) : ViewModel() {

    private val _uiState = MutableStateFlow(UsageListUiState())
    val uiState: StateFlow<UsageListUiState> = _uiState.asStateFlow()

    init {
        load()
        refreshPendingDraftCount()
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
                    usages = paged.itemsOrEmpty(),
                    currentPage = paged.meta?.currentPage ?: 1,
                    totalPages = paged.meta?.totalPages ?: 1,
                )
                refreshPendingDraftCount()
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.userMessage("Gagal memuat data pemakaian"),
                )
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

    fun syncPendingDrafts() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSyncingDrafts = true, error = null)
            val pendingIds = draftUsageRepository.getPendingDraftIds()
            if (pendingIds.isEmpty()) {
                _uiState.value = _uiState.value.copy(
                    isSyncingDrafts = false,
                    notice = "Tidak ada draft yang perlu disinkronkan.",
                    pendingDraftCount = 0,
                )
                return@launch
            }

            pendingIds.forEach { draftId ->
                DraftSyncScheduler.enqueue(appContext, draftId)
            }
            _uiState.value = _uiState.value.copy(
                isSyncingDrafts = false,
                pendingDraftCount = pendingIds.size,
                notice = "Sinkronisasi dijadwalkan untuk ${pendingIds.size} draft.",
            )
        }
    }

    fun consumeNotice() {
        _uiState.value = _uiState.value.copy(notice = null)
    }

    private fun refreshPendingDraftCount() {
        viewModelScope.launch {
            val pendingCount = draftUsageRepository.getPendingDraftIds().size
            _uiState.value = _uiState.value.copy(pendingDraftCount = pendingCount)
        }
    }
}
