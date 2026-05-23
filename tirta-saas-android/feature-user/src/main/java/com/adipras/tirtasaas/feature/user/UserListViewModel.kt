package com.adipras.tirtasaas.feature.user

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.core.network.userMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UserListUiState(
    val isLoading: Boolean = false,
    val users: List<UserDto> = emptyList(),
    val errorMessage: String? = null,
    val showCreateDialog: Boolean = false,
    val editingUser: UserDto? = null,
    val isSaving: Boolean = false,
)

@HiltViewModel
class UserListViewModel @Inject constructor(
    private val repository: UserRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(UserListUiState())
    val uiState: StateFlow<UserListUiState> = _uiState.asStateFlow()

    init {
        loadUsers()
    }

    fun loadUsers() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getUsers()
                .onSuccess { users ->
                    _uiState.update { it.copy(isLoading = false, users = users) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = error.userMessage("Gagal memuat pengguna"))
                    }
                }
        }
    }

    fun showCreateDialog() = _uiState.update { it.copy(showCreateDialog = true, editingUser = null) }
    fun showEditDialog(user: UserDto) = _uiState.update { it.copy(editingUser = user, showCreateDialog = false) }
    fun dismissDialog() = _uiState.update { it.copy(showCreateDialog = false, editingUser = null) }
    fun dismissError() = _uiState.update { it.copy(errorMessage = null) }

    fun createUser(request: CreateUserRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.createUser(request)
                .onSuccess {
                    _uiState.update { it.copy(isSaving = false, showCreateDialog = false) }
                    loadUsers()
                }
                .onFailure { error ->
                    _uiState.update { it.copy(isSaving = false, errorMessage = error.userMessage("Gagal membuat pengguna")) }
                }
        }
    }

    fun updateUser(id: String, request: UpdateUserRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            repository.updateUser(id, request)
                .onSuccess {
                    _uiState.update { it.copy(isSaving = false, editingUser = null) }
                    loadUsers()
                }
                .onFailure { error ->
                    _uiState.update { it.copy(isSaving = false, errorMessage = error.userMessage("Gagal memperbarui pengguna")) }
                }
        }
    }

    fun deleteUser(id: String) {
        viewModelScope.launch {
            repository.deleteUser(id)
                .onSuccess { loadUsers() }
                .onFailure { error -> _uiState.update { it.copy(errorMessage = error.userMessage("Gagal menghapus pengguna")) } }
        }
    }
}
