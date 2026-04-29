package com.adipras.tirtasaas.feature.tenant

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
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
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

object TenantDetailDestination {
    const val routeBase = "tenants"
    const val ARG = "tenantId"
    const val route = "$routeBase/{$ARG}"

    fun createRoute(id: String) = "$routeBase/$id"
}

fun NavGraphBuilder.tenantDetailScreen(
    onBack: () -> Unit,
) {
    composable(
        route = TenantDetailDestination.route,
        arguments = listOf(navArgument(TenantDetailDestination.ARG) { type = NavType.StringType }),
    ) {
        TenantDetailRoute(onBack = onBack)
    }
}

@Composable
internal fun TenantDetailRoute(
    onBack: () -> Unit,
    viewModel: TenantDetailViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.dismissError()
        }
    }

    LaunchedEffect(uiState.deleteSuccess) {
        if (uiState.deleteSuccess) {
            onBack()
        }
    }

    TenantDetailScreen(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onEditClick = viewModel::showEditDialog,
        onDismissEdit = viewModel::dismissEditDialog,
        onSaveEdit = viewModel::saveEdit,
        onApprove = viewModel::approveTenant,
        onRejectClick = viewModel::showRejectDialog,
        onDismissReject = viewModel::dismissRejectDialog,
        onReject = viewModel::rejectTenant,
        onSuspend = viewModel::suspendTenant,
        onActivate = viewModel::activateTenant,
        onDeleteClick = viewModel::showDeleteConfirm,
        onDismissDelete = viewModel::dismissDeleteConfirm,
        onDelete = viewModel::deleteTenant,
    )
}

@Composable
internal fun TenantDetailScreen(
    uiState: TenantDetailUiState,
    snackbarHostState: SnackbarHostState,
    onEditClick: () -> Unit,
    onDismissEdit: () -> Unit,
    onSaveEdit: (String, String, String, String, String) -> Unit,
    onApprove: () -> Unit,
    onRejectClick: () -> Unit,
    onDismissReject: () -> Unit,
    onReject: (String) -> Unit,
    onSuspend: () -> Unit,
    onActivate: () -> Unit,
    onDeleteClick: () -> Unit,
    onDismissDelete: () -> Unit,
    onDelete: () -> Unit,
) {
    Scaffold(snackbarHost = { SnackbarHost(hostState = snackbarHostState) }) { paddingValues ->
        when {
            uiState.isLoading && uiState.tenant == null -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator()
                }
            }

            uiState.tenant != null -> {
                val tenant = uiState.tenant
                val status = tenant.status.uppercase()
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(horizontal = 16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Spacer(Modifier.height(4.dp))

                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top,
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = tenant.name,
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    if (tenant.villageCode.isNotBlank()) {
                                        Text(
                                            text = tenant.villageCode,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                }
                                TenantStatusChip(status = tenant.status)
                            }

                            HorizontalDivider()
                            DetailRow("Email", tenant.email.ifBlank { "-" })
                            HorizontalDivider()
                            DetailRow("No. HP", tenant.phone.ifBlank { "-" })
                            HorizontalDivider()
                            DetailRow("Alamat", tenant.address.ifBlank { "-" })
                            HorizontalDivider()
                            DetailRow("Paket", tenant.subscriptionPlan.ifBlank { "-" })
                            HorizontalDivider()
                            DetailRow("Status Langganan", tenant.subscriptionStatus.ifBlank { "-" })
                            HorizontalDivider()
                            DetailRow("Berakhir", tenant.subscriptionEndsAt ?: "-")
                            if (!tenant.trialEndsAt.isNullOrBlank()) {
                                HorizontalDivider()
                                DetailRow("Akhir Trial", tenant.trialEndsAt)
                            }
                            HorizontalDivider()
                            DetailRow("Pelanggan", tenant.totalCustomers.toString())
                            HorizontalDivider()
                            DetailRow("Pengguna", tenant.totalUsers.toString())
                            HorizontalDivider()
                            DetailRow("Storage", "${tenant.storageUsedGb} GB")
                            HorizontalDivider()
                            DetailRow("Catatan", tenant.notes.ifBlank { "-" })
                        }
                    }

                    when (status) {
                        "PENDING" -> {
                            ActionRow(
                                primaryLabel = "Setujui",
                                secondaryLabel = "Tolak",
                                isSaving = uiState.isSaving,
                                onPrimaryClick = onApprove,
                                onSecondaryClick = onRejectClick,
                                secondaryIsDanger = true,
                            )
                        }

                        "ACTIVE" -> {
                            ActionRow(
                                primaryLabel = "Edit",
                                secondaryLabel = "Suspend",
                                isSaving = uiState.isSaving,
                                onPrimaryClick = onEditClick,
                                onSecondaryClick = onSuspend,
                                secondaryIsDanger = true,
                            )
                        }

                        "SUSPENDED", "EXPIRED", "REJECTED" -> {
                            ActionRow(
                                primaryLabel = "Aktifkan",
                                secondaryLabel = "Edit",
                                isSaving = uiState.isSaving,
                                onPrimaryClick = onActivate,
                                onSecondaryClick = onEditClick,
                            )
                        }

                        else -> {
                            Button(
                                onClick = onEditClick,
                                enabled = !uiState.isSaving,
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text("Edit")
                            }
                        }
                    }

                    OutlinedButton(
                        onClick = onDeleteClick,
                        enabled = !uiState.isSaving,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error,
                        ),
                    ) {
                        Text("Hapus Tenant")
                    }

                    Spacer(Modifier.height(16.dp))
                }

                if (uiState.showEditDialog) {
                    TenantEditDialog(
                        tenant = tenant,
                        isSaving = uiState.isSaving,
                        onDismiss = onDismissEdit,
                        onSave = onSaveEdit,
                    )
                }

                if (uiState.showRejectDialog) {
                    RejectTenantDialog(
                        isSaving = uiState.isSaving,
                        onDismiss = onDismissReject,
                        onReject = onReject,
                    )
                }

                if (uiState.showDeleteConfirm) {
                    AlertDialog(
                        onDismissRequest = onDismissDelete,
                        title = { Text("Hapus Tenant") },
                        text = {
                            Text("Yakin ingin menghapus tenant \"${tenant.name}\"? Tindakan ini tidak dapat dibatalkan.")
                        },
                        confirmButton = {
                            Button(
                                onClick = onDelete,
                                enabled = !uiState.isSaving,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.error,
                                ),
                            ) {
                                Text("Hapus")
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = onDismissDelete) {
                                Text("Batal")
                            }
                        },
                    )
                }
            }

            else -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = "Data tenant tidak ditemukan",
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top,
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

@Composable
private fun ActionRow(
    primaryLabel: String,
    secondaryLabel: String,
    isSaving: Boolean,
    onPrimaryClick: () -> Unit,
    onSecondaryClick: () -> Unit,
    secondaryIsDanger: Boolean = false,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Button(
            onClick = onPrimaryClick,
            enabled = !isSaving,
            modifier = Modifier.weight(1f),
        ) {
            Text(primaryLabel)
        }
        OutlinedButton(
            onClick = onSecondaryClick,
            enabled = !isSaving,
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = if (secondaryIsDanger) {
                    MaterialTheme.colorScheme.error
                } else {
                    MaterialTheme.colorScheme.primary
                },
            ),
        ) {
            Text(secondaryLabel)
        }
    }
}

@Composable
private fun TenantEditDialog(
    tenant: TenantDto,
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onSave: (String, String, String, String, String) -> Unit,
) {
    var name by remember { mutableStateOf(tenant.name) }
    var email by remember { mutableStateOf(tenant.email) }
    var phone by remember { mutableStateOf(tenant.phone) }
    var address by remember { mutableStateOf(tenant.address) }
    var notes by remember { mutableStateOf(tenant.notes) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Tenant") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nama Tenant") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("No. HP") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Alamat") },
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Catatan") },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSave(name, email, phone, address, notes) },
                enabled = !isSaving && name.isNotBlank(),
            ) {
                Text(if (isSaving) "Menyimpan..." else "Simpan")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        },
    )
}

@Composable
private fun RejectTenantDialog(
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onReject: (String) -> Unit,
) {
    var reason by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Tolak Tenant") },
        text = {
            OutlinedTextField(
                value = reason,
                onValueChange = { reason = it },
                label = { Text("Alasan penolakan") },
                modifier = Modifier.fillMaxWidth(),
            )
        },
        confirmButton = {
            Button(
                onClick = { onReject(reason) },
                enabled = !isSaving && reason.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error,
                ),
            ) {
                Text(if (isSaving) "Memproses..." else "Tolak")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        },
    )
}
