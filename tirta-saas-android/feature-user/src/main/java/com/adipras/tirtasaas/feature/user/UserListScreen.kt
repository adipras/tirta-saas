package com.adipras.tirtasaas.feature.user

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.navigation.compose.composable

object UserListDestination {
    const val route = "users"
}

fun NavGraphBuilder.userListScreen() {
    composable(UserListDestination.route) {
        UserListRoute()
    }
}

@Composable
internal fun UserListRoute(
    viewModel: UserListViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.dismissError()
        }
    }

    UserListScreen(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onAddClick = viewModel::showCreateDialog,
        onEditClick = viewModel::showEditDialog,
        onDeleteClick = viewModel::deleteUser,
        onDismissDialog = viewModel::dismissDialog,
        onCreateUser = viewModel::createUser,
        onUpdateUser = viewModel::updateUser,
    )
}

@Composable
internal fun UserListScreen(
    uiState: UserListUiState,
    snackbarHostState: SnackbarHostState,
    onAddClick: () -> Unit,
    onEditClick: (UserDto) -> Unit,
    onDeleteClick: (String) -> Unit,
    onDismissDialog: () -> Unit,
    onCreateUser: (CreateUserRequest) -> Unit,
    onUpdateUser: (String, UpdateUserRequest) -> Unit,
) {
    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddClick) {
                Icon(Icons.Default.Add, contentDescription = "Tambah pengguna")
            }
        },
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
        ) {
            if (uiState.isLoading && uiState.users.isEmpty()) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    item { Spacer(Modifier.height(12.dp)) }
                    items(uiState.users, key = { it.id }) { user ->
                        UserListItem(
                            user = user,
                            onEditClick = { onEditClick(user) },
                            onDeleteClick = { onDeleteClick(user.id) },
                        )
                    }
                    item { Spacer(Modifier.height(80.dp)) }
                }
            }
        }

        if (uiState.showCreateDialog) {
            UserFormDialog(
                title = "Tambah Pengguna",
                isSaving = uiState.isSaving,
                onDismiss = onDismissDialog,
                onSave = { name, email, password, role ->
                    onCreateUser(CreateUserRequest(name, email, password, role))
                },
            )
        }

        uiState.editingUser?.let { user ->
            UserFormDialog(
                title = "Edit Pengguna",
                initialName = user.name,
                initialEmail = user.email,
                initialRole = user.role,
                isSaving = uiState.isSaving,
                onDismiss = onDismissDialog,
                onSave = { name, email, password, role ->
                    onUpdateUser(user.id, UpdateUserRequest(name, email, role, password.takeIf { it.isNotBlank() }))
                },
            )
        }
    }
}

@Composable
private fun UserListItem(
    user: UserDto,
    onEditClick: () -> Unit,
    onDeleteClick: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = user.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = roleLabels[user.role] ?: user.role,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            Row {
                IconButton(onClick = onEditClick) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit")
                }
                IconButton(onClick = onDeleteClick) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Hapus",
                        tint = MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
    }
}

@Composable
private fun UserFormDialog(
    title: String,
    initialName: String = "",
    initialEmail: String = "",
    initialRole: String = "meter_reader",
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onSave: (name: String, email: String, password: String, role: String) -> Unit,
) {
    var name by remember { mutableStateOf(initialName) }
    var email by remember { mutableStateOf(initialEmail) }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf(initialRole) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
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
                    value = password,
                    onValueChange = { password = it },
                    label = { Text(if (initialName.isBlank()) "Password" else "Password (kosongkan jika tidak diubah)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = role,
                    onValueChange = { role = it },
                    label = { Text("Role (${availableRoles.joinToString(", ")})") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSave(name, email, password, role) },
                enabled = !isSaving && name.isNotBlank() && email.isNotBlank(),
            ) {
                Text(if (isSaving) "Menyimpan..." else "Simpan")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Batal") }
        },
    )
}
