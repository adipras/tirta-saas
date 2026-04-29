package com.adipras.tirtasaas.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.net.ConnectException
import java.net.UnknownHostException

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    private val eventChannel = Channel<LoginEvent>(Channel.BUFFERED)
    val events = eventChannel.receiveAsFlow()

    fun onEmailChanged(value: String) {
        _uiState.update { it.copy(email = value, errorMessage = null) }
    }

    fun onPasswordChanged(value: String) {
        _uiState.update { it.copy(password = value, errorMessage = null) }
    }

    fun submit() {
        val state = _uiState.value
        when {
            state.email.isBlank() -> {
                _uiState.update { it.copy(errorMessage = "Email wajib diisi.") }
            }

            state.password.isBlank() -> {
                _uiState.update { it.copy(errorMessage = "Password wajib diisi.") }
            }

            else -> {
                viewModelScope.launch {
                    _uiState.update { it.copy(isSubmitting = true, errorMessage = null) }
                    authRepository.login(state.email, state.password)
                        .onSuccess {
                            eventChannel.send(LoginEvent.LoginSuccess)
                        }
                        .onFailure { throwable ->
                            _uiState.update { it.copy(errorMessage = throwable.toLoginErrorMessage()) }
                        }
                    _uiState.update { it.copy(isSubmitting = false) }
                }
            }
        }
    }
}

private fun Throwable.toLoginErrorMessage(): String = when (this) {
    is TenantAccessBlockedException -> message ?: "Akses tenant tidak tersedia."
    is HttpException -> when (code()) {
        401 -> "Email atau password salah."
        403 -> "Akun tidak memiliki akses."
        else -> "Terjadi kesalahan server (${code()})."
    }
    is UnknownHostException, is ConnectException ->
        "Tidak dapat terhubung ke server. Periksa koneksi internet."
    else -> message ?: "Terjadi kesalahan yang tidak diketahui."
}

sealed interface LoginEvent {
    data object LoginSuccess : LoginEvent
}
