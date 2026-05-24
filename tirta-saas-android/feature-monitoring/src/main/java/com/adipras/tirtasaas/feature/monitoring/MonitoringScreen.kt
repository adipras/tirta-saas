package com.adipras.tirtasaas.feature.monitoring

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
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
import androidx.navigation.compose.composable

object MonitoringDestination {
    const val route = "monitoring"
}

fun NavGraphBuilder.monitoringScreen(
    onBack: () -> Unit,
) {
    composable(MonitoringDestination.route) {
        MonitoringScreen(onBack = onBack)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MonitoringScreen(
    onBack: () -> Unit,
    viewModel: MonitoringViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { snackbarHostState.showSnackbar(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Monitoring Operasional") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Kembali")
                    }
                },
                actions = {
                    IconButton(onClick = viewModel::refresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Segarkan")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { paddingValues ->
        if (uiState.isLoading && uiState.summary == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        val summary = uiState.summary
        if (summary == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                contentAlignment = Alignment.Center,
            ) {
                Button(onClick = viewModel::refresh) {
                    Text("Coba Muat Ulang")
                }
            }
            return@Scaffold
        }

        val cards = listOf(
            MonitoringCardData("Pendapatan", formatCurrency(summary.totalRevenue)),
            MonitoringCardData("Pembayaran Tercatat", summary.paymentCount.toString()),
            MonitoringCardData("Dana Terkumpul", formatCurrency(summary.totalCollected)),
            MonitoringCardData("Total Tunggakan", formatCurrency(summary.totalOutstanding)),
            MonitoringCardData("Tagihan Belum Lunas", summary.unpaidInvoiceCount.toString()),
            MonitoringCardData("Total Pelanggan", summary.totalCustomers.toString()),
            MonitoringCardData("Pelanggan Aktif", summary.activeCustomers.toString()),
            MonitoringCardData("Pelanggan Nonaktif", summary.inactiveCustomers.toString()),
            MonitoringCardData("Total Pemakaian (m³)", formatNumber(summary.totalUsage)),
            MonitoringCardData("Rata-rata Pemakaian (m³)", formatNumber(summary.averageUsage)),
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(cards, key = { it.title }) { card ->
                MonitoringCard(title = card.title, value = card.value)
            }
        }
    }
}

private data class MonitoringCardData(
    val title: String,
    val value: String,
)

@Composable
private fun MonitoringCard(
    title: String,
    value: String,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary,
            )
        }
    }
}

private fun formatCurrency(value: Double): String = "Rp ${String.format("%,.0f", value)}"

private fun formatNumber(value: Double): String = String.format("%,.2f", value)
