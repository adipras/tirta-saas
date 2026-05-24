package com.adipras.tirtasaas.feature.payment

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
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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

object PaymentHistoryDestination {
    const val route = "payment_history"
}

fun NavGraphBuilder.paymentHistoryScreen(
    onReprintReceipt: (invoiceId: String) -> Unit,
) {
    composable(PaymentHistoryDestination.route) {
        PaymentHistoryScreen(onReprintReceipt = onReprintReceipt)
    }
}

@Composable
fun PaymentHistoryScreen(
    onReprintReceipt: (invoiceId: String) -> Unit,
    viewModel: PaymentHistoryViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { snackbarHostState.showSnackbar(it) }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
        ) {
            Text(
                text = "Riwayat Pembayaran",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(12.dp))

            if (uiState.isLoading && uiState.payments.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (uiState.payments.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Belum ada riwayat pembayaran.")
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(uiState.payments, key = { it.id }) { payment ->
                        PaymentHistoryItem(
                            payment = payment,
                            onReprintReceipt = { onReprintReceipt(payment.invoiceId) },
                        )
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconButton(
                        onClick = viewModel::previousPage,
                        enabled = uiState.currentPage > 1,
                    ) {
                        Icon(Icons.Default.ChevronLeft, contentDescription = "Sebelumnya")
                    }
                    Text("${uiState.currentPage} / ${uiState.totalPages}")
                    IconButton(
                        onClick = viewModel::nextPage,
                        enabled = uiState.currentPage < uiState.totalPages,
                    ) {
                        Icon(Icons.Default.ChevronRight, contentDescription = "Berikutnya")
                    }
                }
            }
        }
    }
}

@Composable
private fun PaymentHistoryItem(
    payment: PaymentDto,
    onReprintReceipt: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(payment.invoiceNumber.ifBlank { "Invoice ${payment.invoiceId.take(8)}" }, fontWeight = FontWeight.SemiBold)
            if (payment.customerName.isNotBlank()) {
                Text(payment.customerName, style = MaterialTheme.typography.bodyMedium)
            }
            Text(
                "Nominal: Rp ${String.format("%,.0f", payment.amount)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                "Metode: ${payment.paymentMethod.ifBlank { "-" }}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Button(
                onClick = onReprintReceipt,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Reprint Struk")
            }
        }
    }
}
