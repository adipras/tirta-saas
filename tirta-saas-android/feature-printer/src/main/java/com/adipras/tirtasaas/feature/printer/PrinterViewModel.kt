package com.adipras.tirtasaas.feature.printer

import android.bluetooth.BluetoothDevice
import android.content.Context
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adipras.tirtasaas.feature.invoice.InvoiceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

data class PrinterUiState(
    val isLoading: Boolean = false,
    val bluetoothEnabled: Boolean = false,
    val pairedDevices: List<BluetoothDevice> = emptyList(),
    val connectedDeviceName: String? = null,
    val connectedDeviceAddress: String? = null,
    val isPrinting: Boolean = false,
    val successMessage: String? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class PrinterViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val printerManager: BluetoothPrinterManager,
    private val queueManager: PrintQueueManager,
    private val escPosRenderer: EscPosRenderer,
    private val preferenceRepository: PrinterPreferenceRepository,
    private val invoiceRepository: InvoiceRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val invoiceId: String = checkNotNull(savedStateHandle["invoiceId"])

    private val _uiState = MutableStateFlow(PrinterUiState())
    val uiState: StateFlow<PrinterUiState> = _uiState.asStateFlow()

    init {
        refreshPairedDevices()
    }

    fun refreshPairedDevices() {
        viewModelScope.launch {
            val enabled = printerManager.isBluetoothEnabled
            val devices: List<BluetoothDevice> = if (enabled) {
                try {
                    printerManager.getPairedDevices().toList()
                } catch (e: SecurityException) {
                    Timber.e(e, "Permission denied reading paired devices")
                    emptyList()
                }
            } else {
                emptyList()
            }

            _uiState.update {
                it.copy(
                    bluetoothEnabled = enabled,
                    pairedDevices = devices,
                    connectedDeviceName = printerManager.connectedDeviceName.value,
                    connectedDeviceAddress = printerManager.connectedDeviceAddress.value
                )
            }
        }
    }

    fun connect(device: BluetoothDevice) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, successMessage = null, errorMessage = null) }
            val name = try {
                device.name ?: device.address
            } catch (e: SecurityException) {
                device.address
            }
            val result = printerManager.connect(device)
            if (result.isSuccess) {
                preferenceRepository.savePreferredPrinter(device.address, name)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        connectedDeviceName = name,
                        connectedDeviceAddress = device.address,
                        successMessage = "Terhubung ke $name"
                    )
                }
            } else {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Gagal terhubung ke $name: ${result.exceptionOrNull()?.message}"
                    )
                }
            }
        }
    }

    fun disconnect() {
        viewModelScope.launch {
            printerManager.disconnect()
            _uiState.update {
                it.copy(
                    connectedDeviceName = null,
                    connectedDeviceAddress = null,
                    successMessage = "Printer terputus"
                )
            }
        }
    }

    fun print() {
        viewModelScope.launch {
            _uiState.update { it.copy(isPrinting = true, successMessage = null, errorMessage = null) }
            try {
                val invoiceResult = invoiceRepository.getInvoice(invoiceId)
                val invoice = invoiceResult.getOrNull()
                if (invoice == null) {
                    _uiState.update {
                        it.copy(isPrinting = false, errorMessage = "Gagal memuat invoice")
                    }
                    return@launch
                }
                val receipt = invoice.receipt
                if (receipt == null) {
                    _uiState.update {
                        it.copy(isPrinting = false, errorMessage = "Struk tidak tersedia")
                    }
                    return@launch
                }
                val bytes = escPosRenderer.render(receipt)
                val job = PrintJob(invoiceId = invoiceId, bytes = bytes)
                queueManager.enqueue(job)
                val result = queueManager.processNext()
                if (result.isSuccess) {
                    _uiState.update {
                        it.copy(isPrinting = false, successMessage = "Struk berhasil dicetak")
                    }
                } else {
                    _uiState.update {
                        it.copy(
                            isPrinting = false,
                            errorMessage = "Gagal mencetak: ${result.exceptionOrNull()?.message}"
                        )
                    }
                }
            } catch (e: Exception) {
                Timber.e(e, "Print error")
                _uiState.update { it.copy(isPrinting = false, errorMessage = "Error: ${e.message}") }
            }
        }
    }

    fun clearMessage() {
        _uiState.update { it.copy(successMessage = null) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }
}
