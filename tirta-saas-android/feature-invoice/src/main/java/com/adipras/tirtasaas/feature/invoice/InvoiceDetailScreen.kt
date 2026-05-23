package com.adipras.tirtasaas.feature.invoice

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Print
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument

object InvoiceDetailDestination {
    const val routeBase = "invoice_detail"
    const val ARG = "invoiceId"
    const val route = "$routeBase/{$ARG}"
    fun createRoute(invoiceId: String) = "$routeBase/$invoiceId"
}

fun NavGraphBuilder.invoiceDetailScreen(
    onBack: () -> Unit,
    onNavigateToPrinter: (String) -> Unit,
) {
    composable(
        route = InvoiceDetailDestination.route,
        arguments = listOf(navArgument(InvoiceDetailDestination.ARG) { type = NavType.StringType }),
    ) {
        InvoiceDetailScreen(
            onBack = onBack,
            onNavigateToPrinter = onNavigateToPrinter,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoiceDetailScreen(
    onBack: () -> Unit,
    onNavigateToPrinter: (String) -> Unit,
    viewModel: InvoiceDetailViewModel = hiltViewModel(),
) {
    val invoice by viewModel.invoice.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(error) {
        error?.let { snackbarHostState.showSnackbar(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Detail Tagihan") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
                    }
                },
            )
        },
        floatingActionButton = {
            invoice?.takeIf { it.receipt != null }?.let { currentInvoice ->
                FloatingActionButton(onClick = { onNavigateToPrinter(currentInvoice.id) }) {
                    Icon(Icons.Default.Print, contentDescription = "Cetak Struk")
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when {
                isLoading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                error != null -> Text(
                    "Gagal memuat detail tagihan.",
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(16.dp),
                )
                invoice != null -> InvoiceDetailContent(invoice = invoice!!)
            }
        }
    }
}

@Composable
private fun InvoiceDetailContent(invoice: InvoiceDto) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Informasi Tagihan", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                DetailRow("No. Tagihan", invoice.invoiceNumber)
                DetailRow("Pelanggan", invoice.customerName)
                DetailRow("No. Meter", invoice.meterNumber)
                DetailRow("Bulan", invoice.usageMonth)
                DetailRow("Status", invoice.paymentStatus)
                if (invoice.dueDate != null) DetailRow("Jatuh Tempo", invoice.dueDate)
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Rincian Biaya", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                DetailRow("Pemakaian", "${invoice.usageM3} m³")
                DetailRow("Biaya Air", "Rp ${String.format("%,.0f", invoice.waterCharge)}")
                DetailRow("Abonemen", "Rp ${String.format("%,.0f", invoice.abonemen)}")
                if (invoice.penaltyAmount > 0) DetailRow("Denda", "Rp ${String.format("%,.0f", invoice.penaltyAmount)}")
                HorizontalDivider()
                DetailRow("Total", "Rp ${String.format("%,.0f", invoice.totalAmount)}", bold = true)
                if (invoice.totalPaid > 0) DetailRow("Sudah Dibayar", "Rp ${String.format("%,.0f", invoice.totalPaid)}")
                if (invoice.remainingAmount > 0) DetailRow("Sisa", "Rp ${String.format("%,.0f", invoice.remainingAmount)}", bold = true)
            }
        }

        invoice.receipt?.let { receipt ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Struk", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    DetailRow("Perusahaan", receipt.companyName)
                    if (receipt.companyPhone.isNotBlank()) DetailRow("Telepon", receipt.companyPhone)
                    DetailRow("Meter Awal", "${receipt.meterStart} m³")
                    DetailRow("Meter Akhir", "${receipt.meterEnd} m³")
                    if (receipt.footerText.isNotBlank()) {
                        Spacer(Modifier.height(4.dp))
                        Text(receipt.footerText, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String, bold: Boolean = false) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal, modifier = Modifier.weight(1f))
    }
}
