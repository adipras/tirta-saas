package com.adipras.tirtasaas.feature.printer

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
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
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PrinterUiState(
    val pairedDevices: List<BluetoothDevice> = emptyList(),
    val connectedDeviceName: String? = null,
    val connectedDeviceAddress: String? = null,
    val isConnecting: Boolean = false,
    val isPrinting: Boolean = false,
    val bluetoothEnabled: Boolean = false,
    val message: String? = null,
    val error: String? = null,
)

@HiltViewModel
class PrinterViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val printerManager: BluetoothPrinterManager,
    private val queueManager: PrintQueueManager,
    private val renderer: EscPosRenderer,
    private val prefRepository: PrinterPreferenceRepository,
    private val invoiceRepository: InvoiceRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    val invoiceId: String = checkNotNull(savedStateHandle["invoiceId"])

    private val _uiState = MutableStateFlow(PrinterUiState())
    val uiState: StateFlow<PrinterUiState> = _uiState.asStateFlow()

    private val bluetoothAdapter: BluetoothAdapter? by lazy {
        (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
    }

    init { refreshPairedDevices() }

    fun refreshPairedDevices() {
        val adapter = bluetoothAdapter
        if (adapter == null || !adapter.isEnabled) {
            _uiState.value = _uiState.value.copy(
                bluetoothEnabled = false,
                pairedDevices = emptyList(),
                connectedDeviceName = null,
                connectedDeviceAddress = null,
            )
            return
        }
        _uiState.value = _uiState.value.copy(
            bluetoothEnabled = true,
            pairedDevices = printerManager.getPairedPrinters(adapter),
            connectedDeviceName = printerManager.connectedDeviceName(),
            connectedDeviceAddress = printerManager.connectedDeviceAddress(),
        )
    }

    fun connect(device: BluetoothDevice) {
        viewModelScope.launch {
            val deviceName = try {
                device.name ?: "Unknown"
            } catch (e: SecurityException) {
                "Unknown"
            }
            _uiState.value = _uiState.value.copy(isConnecting = true, error = null)
            printerManager.connect(device)
                .onSuccess {
                    viewModelScope.launch { prefRepository.save(device.address, deviceName) }
                    _uiState.value = _uiState.value.copy(
                        isConnecting = false,
                        connectedDeviceName = deviceName,
                        connectedDeviceAddress = device.address,
                        message = "Terhubung ke $deviceName",
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isConnecting = false,
                        error = "Gagal terhubung: ${e.message}",
                    )
                }
        }
    }

    fun disconnect() {
        printerManager.disconnect()
        _uiState.value = _uiState.value.copy(
            connectedDeviceName = null,
            connectedDeviceAddress = null,
            message = "Terputus dari printer",
        )
    }

    fun print() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPrinting = true, error = null, message = null)
            invoiceRepository.getInvoice(invoiceId)
                .onSuccess { invoice ->
                    val receipt = invoice.receipt
                    if (receipt == null) {
                        _uiState.value = _uiState.value.copy(isPrinting = false, error = "Struk tidak tersedia untuk tagihan ini")
                        return@onSuccess
                    }
                    queueManager.enqueue(invoiceId, renderer.render(receipt))
                    val status = queueManager.processNext()
                    if (status == PrintJobStatus.SUCCESS) {
                        _uiState.value = _uiState.value.copy(isPrinting = false, message = "Struk berhasil dicetak")
                    } else {
                        _uiState.value = _uiState.value.copy(isPrinting = false, error = "Gagal mencetak struk, akan dicoba ulang")
                    }
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(isPrinting = false, error = "Gagal memuat tagihan: ${e.message}")
                }
        }
    }

    fun clearMessage() { _uiState.value = _uiState.value.copy(message = null) }
    fun clearError()   { _uiState.value = _uiState.value.copy(error = null) }
}
