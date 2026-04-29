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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable

object TenantListDestination {
    const val route = "tenants"
}

fun NavGraphBuilder.tenantListScreen(
    onTenantClick: (String) -> Unit,
) {
    composable(TenantListDestination.route) {
        TenantListRoute(onTenantClick = onTenantClick)
    }
}

@Composable
internal fun TenantListRoute(
    onTenantClick: (String) -> Unit,
    viewModel: TenantListViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.dismissError()
        }
    }

    TenantListScreen(
        uiState = uiState,
        snackbarHostState = snackbarHostState,
        onSearchQueryChange = viewModel::onSearchQueryChange,
        onStatusFilterChange = viewModel::onStatusFilterChange,
        onTenantClick = onTenantClick,
    )
}

private val statusFilters = listOf(null, "ACTIVE", "PENDING", "SUSPENDED", "EXPIRED")
private val statusLabels = mapOf(
    null to "Semua",
    "ACTIVE" to "Aktif",
    "PENDING" to "Pending",
    "SUSPENDED" to "Ditangguhkan",
    "EXPIRED" to "Kedaluwarsa",
)

@Composable
internal fun TenantListScreen(
    uiState: TenantListUiState,
    snackbarHostState: SnackbarHostState,
    onSearchQueryChange: (String) -> Unit,
    onStatusFilterChange: (String?) -> Unit,
    onTenantClick: (String) -> Unit,
) {
    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { paddingValues ->
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
                placeholder = { Text("Cari tenant...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
            )

            Spacer(Modifier.height(8.dp))

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(statusFilters) { status ->
                    FilterChip(
                        selected = uiState.statusFilter == status,
                        onClick = { onStatusFilterChange(status) },
                        label = { Text(statusLabels[status] ?: status.orEmpty()) },
                    )
                }
            }

            Spacer(Modifier.height(4.dp))

            Text(
                text = "Total: ${uiState.total} tenant",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(8.dp))

            if (uiState.isLoading && uiState.tenants.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(uiState.tenants, key = { it.id }) { tenant ->
                        TenantListItem(tenant = tenant, onClick = { onTenantClick(tenant.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun TenantListItem(
    tenant: TenantDto,
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
                verticalAlignment = Alignment.Top,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = tenant.name,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = tenant.adminEmail.ifBlank { tenant.email },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = tenant.subscriptionPlan,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
                TenantStatusChip(status = tenant.status)
            }
            if (tenant.totalCustomers > 0 || tenant.totalUsers > 0) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "${tenant.totalCustomers} pelanggan • ${tenant.totalUsers} pengguna",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
fun TenantStatusChip(status: String) {
    val color = when (status.uppercase()) {
        "ACTIVE" -> MaterialTheme.colorScheme.primary
        "PENDING" -> MaterialTheme.colorScheme.tertiary
        "SUSPENDED" -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.outline
    }
    val label = when (status.uppercase()) {
        "ACTIVE" -> "Aktif"
        "PENDING" -> "Pending"
        "SUSPENDED" -> "Ditangguhkan"
        "EXPIRED" -> "Kedaluwarsa"
        "REJECTED" -> "Ditolak"
        else -> status
    }
    Text(
        text = label,
        style = MaterialTheme.typography.labelSmall,
        color = color,
        fontWeight = FontWeight.Medium,
    )
}
