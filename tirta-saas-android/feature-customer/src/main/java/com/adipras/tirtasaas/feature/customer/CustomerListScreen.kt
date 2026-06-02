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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
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

object CustomerListDestination {
    const val route = "customers"
}

fun NavGraphBuilder.customerListScreen(
    onCustomerClick: (String) -> Unit,
) {
    composable(CustomerListDestination.route) {
        CustomerListRoute(onCustomerClick = onCustomerClick)
    }
}

@Composable
internal fun CustomerListRoute(
    onCustomerClick: (String) -> Unit,
    viewModel: CustomerListViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.dismissError()
        }
    }

    CustomerListScreen(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onAddClick = viewModel::showCreateDialog,
        onDismissCreateDialog = viewModel::dismissCreateDialog,
        onSearchQueryChange = viewModel::onSearchQueryChange,
        onServiceAreaFilterChange = viewModel::onServiceAreaFilterChange,
        onReadingRouteFilterChange = viewModel::onReadingRouteFilterChange,
        onApplyRouteFilter = viewModel::applyRouteFilter,
        onCreateCustomer = viewModel::createCustomer,
        onCustomerClick = onCustomerClick,
    )
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
internal fun CustomerListScreen(
    uiState: CustomerListUiState,
    snackbarHostState: SnackbarHostState,
    onAddClick: () -> Unit,
    onDismissCreateDialog: () -> Unit,
    onSearchQueryChange: (String) -> Unit,
    onServiceAreaFilterChange: (String?) -> Unit,
    onReadingRouteFilterChange: (String) -> Unit,
    onApplyRouteFilter: () -> Unit,
    onCreateCustomer: (CreateCustomerRequest) -> Unit,
    onCustomerClick: (String) -> Unit,
) {
    val listState = rememberLazyListState()
    var areaDropdownExpanded by remember { mutableStateOf(false) }
    val selectedAreaName = uiState.serviceAreas
        .firstOrNull { it.id == uiState.selectedServiceAreaId }
        ?.name
        ?: "Semua Area"

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddClick) {
                Icon(Icons.Default.Add, contentDescription = "Tambah pelanggan")
            }
        },
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
        ) {
            Spacer(Modifier.height(12.dp))

            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = onSearchQueryChange,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Cari pelanggan...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
            )

            Spacer(Modifier.height(8.dp))

            ExposedDropdownMenuBox(
                expanded = areaDropdownExpanded,
                onExpandedChange = { areaDropdownExpanded = it },
            ) {
                OutlinedTextField(
                    value = selectedAreaName,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Area Layanan") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = areaDropdownExpanded) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                )
                ExposedDropdownMenu(
                    expanded = areaDropdownExpanded,
                    onDismissRequest = { areaDropdownExpanded = false },
                ) {
                    DropdownMenuItem(
                        text = { Text("Semua Area") },
                        onClick = {
                            areaDropdownExpanded = false
                            onServiceAreaFilterChange(null)
                        },
                    )
                    uiState.serviceAreas.forEach { area ->
                        DropdownMenuItem(
                            text = { Text("${area.code} - ${area.name}") },
                            onClick = {
                                areaDropdownExpanded = false
                                onServiceAreaFilterChange(area.id)
                            },
                        )
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            OutlinedTextField(
                value = uiState.readingRouteIdFilter,
                onValueChange = onReadingRouteFilterChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Reading Route ID (opsional)") },
                singleLine = true,
            )

            Spacer(Modifier.height(8.dp))

            TextButton(
                onClick = onApplyRouteFilter,
                modifier = Modifier.align(Alignment.End),
            ) {
                Text("Terapkan Filter Route")
            }

            Spacer(Modifier.height(8.dp))

            Text(
                text = "Total: ${uiState.total} pelanggan",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(8.dp))

            if (uiState.isLoading && uiState.customers.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(
                    state = listState,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(uiState.customers, key = { it.id }) { customer ->
                        CustomerListItem(customer = customer, onClick = { onCustomerClick(customer.id) })
                    }
                    if (uiState.isLoading) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                CircularProgressIndicator()
                            }
                        }
                    }
                }
            }
        }

        if (uiState.showCreateDialog) {
            CustomerCreateDialog(
                subscriptionTypes = uiState.subscriptionTypes,
                isSaving = uiState.isSaving,
                onDismiss = onDismissCreateDialog,
                onSave = onCreateCustomer,
            )
        }
    }
}

@Composable
private fun CustomerListItem(
    customer: CustomerDto,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = customer.name,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                    val primaryMeter = customer.meters.firstOrNull()
                    if (primaryMeter != null) {
                        Text(
                            text = "No. Meter: ${primaryMeter.meterNumber}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    customer.subscription?.let {
                        Text(
                            text = it.name,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                    if (!customer.serviceAreaName.isNullOrBlank()) {
                        Text(
                            text = "Area: ${customer.serviceAreaName}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    if (!customer.readingRouteName.isNullOrBlank()) {
                        Text(
                            text = "Route: ${customer.readingRouteName}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                FilterChip(
                    selected = customer.isActive,
                    onClick = {},
                    label = { Text(if (customer.isActive) "Aktif" else "Nonaktif") },
                )
            }
            if (customer.phone.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = customer.phone,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CustomerCreateDialog(
    subscriptionTypes: List<SubscriptionTypeDto>,
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onSave: (CreateCustomerRequest) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var meterNumber by remember { mutableStateOf("") }
    var selectedSubId by remember { mutableStateOf(subscriptionTypes.firstOrNull()?.id.orEmpty()) }
    var installDate by remember { mutableStateOf(java.time.LocalDate.now().toString()) }
    var dropdownExpanded by remember { mutableStateOf(false) }

    val selectedSub = subscriptionTypes.find { it.id == selectedSubId }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Tambah Pelanggan") },
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
                    label = { Text("Email (opsional)") },
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
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = meterNumber,
                    onValueChange = { meterNumber = it },
                    label = { Text("No. Meter") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = installDate,
                    onValueChange = { installDate = it },
                    label = { Text("Tgl Pasang (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                if (subscriptionTypes.isNotEmpty()) {
                    ExposedDropdownMenuBox(
                        expanded = dropdownExpanded,
                        onExpandedChange = { dropdownExpanded = it },
                    ) {
                        OutlinedTextField(
                            value = selectedSub?.name ?: "",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Golongan Langganan") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = dropdownExpanded) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                        )
                        ExposedDropdownMenu(
                            expanded = dropdownExpanded,
                            onDismissRequest = { dropdownExpanded = false },
                        ) {
                            subscriptionTypes.forEach { subscription ->
                                DropdownMenuItem(
                                    text = { Text(subscription.name) },
                                    onClick = {
                                        selectedSubId = subscription.id
                                        dropdownExpanded = false
                                    },
                                )
                            }
                        }
                    }
                } else {
                    Text(
                        text = "Paket langganan belum tersedia.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(
                        CreateCustomerRequest(
                            name = name,
                            email = email.ifBlank { null },
                            phone = phone,
                            address = address,
                            password = password,
                            meters = listOf(
                                MeterInputDto(
                                    meterNumber = meterNumber,
                                    subscriptionTypeId = selectedSubId,
                                    installDate = installDate,
                                )
                            ),
                        ),
                    )
                },
                enabled = !isSaving &&
                    meterNumber.isNotBlank() &&
                    name.isNotBlank() &&
                    password.length >= 6 &&
                    selectedSubId.isNotBlank() &&
                    installDate.isNotBlank(),
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
