package com.adipras.tirtasaas.feature.printer

import android.Manifest
import android.bluetooth.BluetoothDevice
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.BluetoothConnected
import androidx.compose.material.icons.filled.BluetoothDisabled
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument

object PrinterDestination {
    const val routeBase = "printer"
    const val ARG = "invoiceId"
    const val route = "$routeBase/{$ARG}"
    fun createRoute(invoiceId: String) = "$routeBase/$invoiceId"
}

fun NavGraphBuilder.printerScreen(onBack: () -> Unit) {
    composable(
        route = PrinterDestination.route,
        arguments = listOf(navArgument(PrinterDestination.ARG) { type = NavType.StringType }),
    ) {
        PrinterScreen(onBack = onBack)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrinterScreen(
    onBack: () -> Unit,
    viewModel: PrinterViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    val permissionsToRequest = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        arrayOf(Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN)
    } else {
        @Suppress("DEPRECATION")
        arrayOf(Manifest.permission.BLUETOOTH, Manifest.permission.BLUETOOTH_ADMIN)
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { results ->
        if (results.values.all { it }) viewModel.refreshPairedDevices()
    }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }
    LaunchedEffect(state.error) {
        state.error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Cetak Struk") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Kembali")
                    }
                },
                actions = {
                    IconButton(onClick = viewModel::refreshPairedDevices) {
                        Icon(Icons.Default.Refresh, contentDescription = "Segarkan")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            if (state.connectedDeviceName != null) {
                ExtendedFloatingActionButton(
                    onClick = { if (!state.isPrinting) viewModel.print() },
                    icon = {
                        if (state.isPrinting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                            )
                        } else {
                            Icon(Icons.Default.Print, contentDescription = null)
                        }
                    },
                    text = { Text(if (state.isPrinting) "Mencetak…" else "Cetak Struk") },
                )
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    if (state.connectedDeviceName != null) {
                        Icon(
                            Icons.Default.BluetoothConnected,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "Terhubung",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                            )
                            Text(state.connectedDeviceName!!, style = MaterialTheme.typography.bodyLarge)
                        }
                        TextButton(onClick = viewModel::disconnect) { Text("Putus") }
                    } else {
                        Icon(
                            Icons.Default.BluetoothDisabled,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.outline,
                        )
                        Text("Belum terhubung ke printer", color = MaterialTheme.colorScheme.outline)
                    }
                }
            }

            if (!state.bluetoothEnabled) {
                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text("Bluetooth tidak aktif atau izin belum diberikan.")
                        Button(onClick = { permissionLauncher.launch(permissionsToRequest) }) {
                            Text("Izinkan Bluetooth")
                        }
                    }
                }
            } else {
                Text("Printer Tersimpan (Bluetooth)", style = MaterialTheme.typography.titleSmall)
                if (state.pairedDevices.isEmpty()) {
                    Text(
                        "Tidak ada printer yang dipasangkan. Pasangkan printer via pengaturan Bluetooth perangkat, lalu segarkan.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(state.pairedDevices, key = { it.address }) { device ->
                            PrinterDeviceCard(
                                name = safeDeviceName(device),
                                address = device.address,
                                isConnected = device.address == state.connectedDeviceAddress,
                                isConnecting = state.isConnecting,
                                onConnect = { viewModel.connect(device) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PrinterDeviceCard(
    name: String,
    address: String,
    isConnected: Boolean,
    isConnecting: Boolean,
    onConnect: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = !isConnected && !isConnecting, onClick = onConnect),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Icon(
                if (isConnected) Icons.Default.BluetoothConnected else Icons.Default.BluetoothDisabled,
                contentDescription = null,
                tint = if (isConnected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(name, style = MaterialTheme.typography.bodyLarge)
                Text(address, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (isConnected) {
                Text("Terhubung", color = MaterialTheme.colorScheme.primary)
            } else {
                TextButton(onClick = onConnect, enabled = !isConnecting) {
                    Text(if (isConnecting) "Menghubungkan…" else "Hubungkan")
                }
            }
        }
    }
}

private fun safeDeviceName(device: BluetoothDevice): String = try {
    device.name ?: device.address
} catch (e: SecurityException) {
    device.address
}
