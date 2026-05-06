package com.adipras.tirtasaas.feature.invoice

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable

object InvoiceListDestination {
    const val route = "invoice_list"
}

fun NavGraphBuilder.invoiceListScreen(onNavigateToDetail: (String) -> Unit) {
    composable(InvoiceListDestination.route) {
        InvoiceListScreen(onNavigateToDetail = onNavigateToDetail)
    }
}

@Composable
fun InvoiceListScreen(
    onNavigateToDetail: (String) -> Unit,
    viewModel: InvoiceListViewModel = hiltViewModel(),
) {
    val invoices by viewModel.invoices.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val currentPage by viewModel.currentPage.collectAsState()
    val totalPages by viewModel.totalPages.collectAsState()

    var filterMonth by remember { mutableStateOf("") }
    var filterStatus by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Tagihan", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = filterMonth,
                onValueChange = { filterMonth = it },
                label = { Text("Bulan (YYYY-MM)") },
                modifier = Modifier.weight(1f),
                singleLine = true,
            )
            OutlinedTextField(
                value = filterStatus,
                onValueChange = { filterStatus = it },
                label = { Text("Status") },
                modifier = Modifier.weight(1f),
                singleLine = true,
            )
        }
        Spacer(Modifier.height(8.dp))
        Button(
            onClick = {
                viewModel.applyFilters(
                    customerId = null,
                    usageMonth = filterMonth.ifBlank { null },
                    status = filterStatus.ifBlank { null },
                )
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Filter") }

        Spacer(Modifier.height(12.dp))

        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (error != null) {
            Text("Error: $error", color = MaterialTheme.colorScheme.error)
        } else {
            LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(invoices) { invoice ->
                    InvoiceCard(invoice = invoice, onClick = { onNavigateToDetail(invoice.id) })
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = { viewModel.prevPage() }, enabled = currentPage > 1) {
                    Icon(Icons.Default.ChevronLeft, contentDescription = "Sebelumnya")
                }
                Text("$currentPage / $totalPages")
                IconButton(onClick = { viewModel.nextPage() }, enabled = currentPage < totalPages) {
                    Icon(Icons.Default.ChevronRight, contentDescription = "Berikutnya")
                }
            }
        }
    }
}

@Composable
private fun InvoiceCard(invoice: InvoiceDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(invoice.invoiceNumber, fontWeight = FontWeight.SemiBold)
                StatusChip(status = invoice.paymentStatus)
            }
            Spacer(Modifier.height(4.dp))
            Text(invoice.customerName, style = MaterialTheme.typography.bodyMedium)
            Text(
                "Bulan: ${invoice.usageMonth}  |  Total: Rp ${String.format("%,.0f", invoice.totalAmount)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun StatusChip(status: String) {
    val color = when (status) {
        "paid" -> MaterialTheme.colorScheme.primary
        "overdue" -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.secondary
    }
    Surface(color = color.copy(alpha = 0.15f), shape = MaterialTheme.shapes.small) {
        Text(
            text = status,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            style = MaterialTheme.typography.labelSmall,
            color = color,
        )
    }
}
