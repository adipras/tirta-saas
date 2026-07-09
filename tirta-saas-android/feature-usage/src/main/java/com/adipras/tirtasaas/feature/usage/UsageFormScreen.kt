package com.adipras.tirtasaas.feature.usage

import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.adipras.tirtasaas.feature.customer.MeterDto
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import kotlinx.coroutines.launch
import java.util.Locale

object UsageFormDestination {
    const val route = "usage_form"
    const val ARG = "usageId"
    val routeWithArg = "$route?$ARG={$ARG}"
    fun createRoute(usageId: String?) = if (usageId != null) "$route?$ARG=$usageId" else route
}

fun NavGraphBuilder.usageFormScreen(onSaved: () -> Unit, onBack: () -> Unit) {
    composable(
        route = UsageFormDestination.routeWithArg,
        arguments = listOf(navArgument(UsageFormDestination.ARG) {
            type = NavType.StringType
            nullable = true
            defaultValue = null
        }),
    ) { backStackEntry ->
        val usageId = backStackEntry.arguments?.getString(UsageFormDestination.ARG)
        UsageFormScreen(usageId = usageId, onSaved = onSaved, onBack = onBack)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UsageFormScreen(
    usageId: String? = null,
    onSaved: () -> Unit,
    onBack: () -> Unit,
    viewModel: UsageFormViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val photoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent(),
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            runCatching {
                val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
                val fileName = run {
                    var name: String? = null
                    context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                        if (cursor.moveToFirst()) {
                            val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                            if (idx >= 0) {
                                name = cursor.getString(idx)
                            }
                        }
                    }
                    name ?: "meter-photo-${System.currentTimeMillis()}.jpg"
                }
                val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                if (bytes == null || bytes.isEmpty()) {
                    viewModel.onPhotoReadFailed("Gagal membaca file foto meter")
                    return@runCatching
                }
                viewModel.uploadPhoto(
                    fileName = fileName.lowercase(Locale.getDefault()),
                    mimeType = mimeType,
                    bytes = bytes,
                )
            }.onFailure {
                viewModel.onPhotoReadFailed("Gagal memproses foto meter")
            }
        }
    }

    LaunchedEffect(state.saveSuccess) {
        if (state.saveSuccess) onSaved()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (usageId == null) "Tambah Pemakaian" else "Edit Pemakaian") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Kembali")
                    }
                },
            )
        },
    ) { padding ->
        if (state.isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        Column(
            Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            OutlinedTextField(
                value = state.customerId,
                onValueChange = viewModel::onCustomerIdChange,
                label = { Text("Customer ID") },
                modifier = Modifier.fillMaxWidth(),
                enabled = usageId == null,
                singleLine = true,
            )

            // Meter selection — shown after customer is entered
            if (usageId == null && state.customerId.isNotBlank()) {
                if (state.customerMeters.size == 1) {
                    val meter = state.customerMeters[0]
                    val meterLabel = buildString {
                        append(meter.meterNumber)
                        if (!meter.locationName.isNullOrBlank()) append(" (${meter.locationName})")
                        append(" — ${meter.subscriptionType?.name ?: "-"}")
                    }
                    Text(
                        text = "Meter: $meterLabel",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else if (state.customerMeters.size > 1) {
                    var meterDropdownExpanded by remember { mutableStateOf(false) }
                    val selectedMeter = state.customerMeters.firstOrNull { it.id == state.selectedMeterId }
                    fun meterDisplayLabel(meter: MeterDto) = buildString {
                        append(meter.meterNumber)
                        if (!meter.locationName.isNullOrBlank()) append(" (${meter.locationName})")
                        append(" — ${meter.subscriptionType?.name ?: "-"}")
                    }
                    ExposedDropdownMenuBox(
                        expanded = meterDropdownExpanded,
                        onExpandedChange = { meterDropdownExpanded = it },
                    ) {
                        OutlinedTextField(
                            value = selectedMeter?.let { meterDisplayLabel(it) } ?: "",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Pilih Meter") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(meterDropdownExpanded) },
                            modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable),
                        )
                        ExposedDropdownMenu(
                            expanded = meterDropdownExpanded,
                            onDismissRequest = { meterDropdownExpanded = false },
                        ) {
                            state.customerMeters.forEach { meter ->
                                DropdownMenuItem(
                                    text = { Text(meterDisplayLabel(meter)) },
                                    onClick = {
                                        viewModel.onMeterSelected(meter.id)
                                        meterDropdownExpanded = false
                                    },
                                )
                            }
                        }
                    }
                }

                // Show resolved meter_start as read-only info
                if (state.meterStartValue != null) {
                    OutlinedTextField(
                        value = "%.2f m³".format(state.meterStartValue),
                        onValueChange = {},
                        label = { Text("Angka Awal (Otomatis)") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = false,
                        supportingText = { Text(state.meterStartDescription) },
                    )
                }
            }

            OutlinedTextField(
                value = state.usageMonth,
                onValueChange = viewModel::onUsageMonthChange,
                label = { Text("Bulan Pemakaian (YYYY-MM)") },
                modifier = Modifier.fillMaxWidth(),
                enabled = usageId == null,
                singleLine = true,
                placeholder = { Text("Contoh: 2025-01") },
            )
            OutlinedTextField(
                value = state.meterEnd,
                onValueChange = viewModel::onMeterEndChange,
                label = { Text("Meter Akhir (m³)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = state.notes,
                onValueChange = viewModel::onNotesChange,
                label = { Text("Catatan (opsional)") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 3,
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = state.isDraft, onCheckedChange = viewModel::onDraftChange)
                Text("Simpan sebagai draft")
            }

            if (usageId != null) {
                Button(
                    onClick = { photoPicker.launch("image/*") },
                    enabled = !state.isUploadingPhoto,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (state.isUploadingPhoto) {
                        CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp))
                    }
                    Text(if (state.photoUrl.isBlank()) "Upload Foto Meter" else "Ganti Foto Meter")
                }
                if (state.photoUrl.isNotBlank()) {
                    Text(
                        text = "Foto tersimpan: ${state.photoUrl}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            if (state.error != null) {
                Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
            }

            Button(
                onClick = viewModel::save,
                enabled = !state.isSaving,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (state.isSaving) CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp))
                Text(if (usageId == null) "Simpan" else "Perbarui")
            }
        }
    }
}
