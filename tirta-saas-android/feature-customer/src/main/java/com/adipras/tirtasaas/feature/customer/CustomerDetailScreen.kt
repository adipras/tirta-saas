package com.adipras.tirtasaas.feature.customer

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument

object CustomerDetailDestination {
    const val routeBase = "customers"
    const val ARG = "customerId"
    const val route = "$routeBase/{$ARG}"
    fun createRoute(id: String) = "$routeBase/$id"
}

fun NavGraphBuilder.customerDetailScreen(
    onBack: () -> Unit,
) {
    composable(
        route = CustomerDetailDestination.route,
        arguments = listOf(navArgument(CustomerDetailDestination.ARG) { type = NavType.StringType }),
    ) {
        CustomerDetailRoute(onBack = onBack)
    }
}

@Composable
internal fun CustomerDetailRoute(
    onBack: () -> Unit,
    viewModel: CustomerDetailViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.deleteSuccess) {
        if (uiState.deleteSuccess) onBack()
    }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.dismissError()
        }
    }

    CustomerDetailScreen(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onEditClick = viewModel::showEditDialog,
        onDeleteClick = viewModel::showDeleteConfirm,
        onToggleActive = viewModel::toggleActive,
        onSaveEdit = viewModel::saveEdit,
        onDismissEdit = viewModel::dismissEditDialog,
        onConfirmDelete = viewModel::confirmDelete,
        onDismissDelete = viewModel::dismissDeleteConfirm,
    )
}

@Composable
internal fun CustomerDetailScreen(
    uiState: CustomerDetailUiState,
    snackbarHostState: SnackbarHostState,
    onEditClick: () -> Unit,
    onDeleteClick: () -> Unit,
    onToggleActive: () -> Unit,
    onSaveEdit: (String, String, String, String, String) -> Unit,
    onDismissEdit: () -> Unit,
    onConfirmDelete: () -> Unit,
    onDismissDelete: () -> Unit,
) {
    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { paddingValues ->
        when {
            uiState.isLoading && uiState.customer == null -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentAlignment = Alignment.Center,
                ) { CircularProgressIndicator() }
            }

            uiState.customer != null -> {
                val customer = uiState.customer
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(horizontal = 16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Spacer(Modifier.height(4.dp))

                    // Status + toggle active
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        FilterChip(
                            selected = customer.isActive,
                            onClick = onToggleActive,
                            label = { Text(if (customer.isActive) "Aktif" else "Nonaktif") },
                        )
                        Text(
                            text = "Ketuk status untuk mengubah",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }

                    // Main info card
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            InfoRow("Nama", customer.name)
                            HorizontalDivider()
                            InfoRow("No. Meter", customer.meterNumber)
                            HorizontalDivider()
                            customer.subscription?.let { InfoRow("Paket", it.name); HorizontalDivider() }
                            InfoRow("Email", customer.email.ifBlank { "-" })
                            HorizontalDivider()
                            InfoRow("No. HP", customer.phone.ifBlank { "-" })
                            HorizontalDivider()
                            InfoRow("Alamat", customer.address.ifBlank { "-" })
                        }
                    }

                    // Actions
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = onEditClick, modifier = Modifier.weight(1f)) {
                            Text("Edit")
                        }
                        OutlinedButton(
                            onClick = onDeleteClick,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = MaterialTheme.colorScheme.error,
                            ),
                        ) {
                            Text("Hapus")
                        }
                    }

                    Spacer(Modifier.height(16.dp))
                }

                // Edit Dialog
                if (uiState.showEditDialog) {
                    CustomerEditDialog(
                        customer = customer,
                        subscriptionTypes = uiState.subscriptionTypes,
                        isSaving = uiState.isSaving,
                        onDismiss = onDismissEdit,
                        onSave = onSaveEdit,
                    )
                }

                // Delete Confirmation
                if (uiState.showDeleteConfirm) {
                    AlertDialog(
                        onDismissRequest = onDismissDelete,
                        title = { Text("Hapus Pelanggan") },
                        text = { Text("Yakin ingin menghapus pelanggan \"${customer.name}\"? Tindakan ini tidak dapat dibatalkan.") },
                        confirmButton = {
                            Button(
                                onClick = onConfirmDelete,
                                enabled = !uiState.isSaving,
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                            ) { Text("Hapus") }
                        },
                        dismissButton = {
                            TextButton(onClick = onDismissDelete) { Text("Batal") }
                        },
                    )
                }
            }

            else -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("Data pelanggan tidak ditemukan", color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(0.4f),
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(0.6f),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CustomerEditDialog(
    customer: CustomerDto,
    subscriptionTypes: List<SubscriptionTypeDto>,
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onSave: (String, String, String, String, String) -> Unit,
) {
    var name by remember { mutableStateOf(customer.name) }
    var email by remember { mutableStateOf(customer.email) }
    var phone by remember { mutableStateOf(customer.phone) }
    var address by remember { mutableStateOf(customer.address) }
    var selectedSubId by remember { mutableStateOf(customer.subscriptionId) }
    var dropdownExpanded by remember { mutableStateOf(false) }

    val selectedSub = subscriptionTypes.find { it.id == selectedSubId }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Pelanggan") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nama") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("No. HP") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Alamat") },
                    modifier = Modifier.fillMaxWidth(),
                )
                if (subscriptionTypes.isNotEmpty()) {
                    ExposedDropdownMenuBox(
                        expanded = dropdownExpanded,
                        onExpandedChange = { dropdownExpanded = it },
                    ) {
                        OutlinedTextField(
                            value = selectedSub?.name ?: selectedSubId,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Paket Langganan") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(dropdownExpanded) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                        )
                        ExposedDropdownMenu(
                            expanded = dropdownExpanded,
                            onDismissRequest = { dropdownExpanded = false },
                        ) {
                            subscriptionTypes.forEach { sub ->
                                DropdownMenuItem(
                                    text = { Text(sub.name) },
                                    onClick = {
                                        selectedSubId = sub.id
                                        dropdownExpanded = false
                                    },
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onSave(name, email, phone, address, selectedSubId) },
                enabled = !isSaving && name.isNotBlank(),
            ) { Text(if (isSaving) "Menyimpan..." else "Simpan") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Batal") }
        },
    )
}
