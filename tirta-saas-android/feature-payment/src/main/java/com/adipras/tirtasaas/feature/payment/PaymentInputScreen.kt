package com.adipras.tirtasaas.feature.payment

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument

private data class PaymentMethodOption(
    val code: String,
    val label: String,
)

private val paymentMethodOptions = listOf(
    PaymentMethodOption("cash", "Tunai"),
    PaymentMethodOption("bank_transfer", "Transfer Bank"),
    PaymentMethodOption("e_wallet", "Dompet Digital"),
    PaymentMethodOption("qris", "QRIS"),
)

object PaymentInputDestination {
    const val routeBase = "payment_input"
    const val ARG = "invoiceId"
    const val route = "$routeBase/{$ARG}"
    fun createRoute(invoiceId: String) = "$routeBase/$invoiceId"
}

fun NavGraphBuilder.paymentInputScreen(onSaved: () -> Unit, onBack: () -> Unit) {
    composable(
        route = PaymentInputDestination.route,
        arguments = listOf(navArgument(PaymentInputDestination.ARG) { type = NavType.StringType }),
    ) {
        PaymentInputScreen(onSaved = onSaved, onBack = onBack)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentInputScreen(
    onSaved: () -> Unit,
    onBack: () -> Unit,
    viewModel: PaymentViewModel = hiltViewModel(),
) {
    val isLoading by viewModel.isLoading.collectAsState()
    val success by viewModel.success.collectAsState()
    val error by viewModel.error.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var amount by remember { mutableStateOf("") }
    var paymentMethod by remember { mutableStateOf(paymentMethodOptions.first().code) }
    var notes by remember { mutableStateOf("") }
    var paymentMethodExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(success) {
        if (success) onSaved()
    }

    LaunchedEffect(error) {
        error?.let { snackbarHostState.showSnackbar(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Input Pembayaran") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Jumlah Pembayaran (Rp)") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                singleLine = true,
            )

            ExposedDropdownMenuBox(
                expanded = paymentMethodExpanded,
                onExpandedChange = { paymentMethodExpanded = it },
            ) {
                OutlinedTextField(
                    value = paymentMethodOptions.firstOrNull { it.code == paymentMethod }?.label.orEmpty(),
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Metode Pembayaran") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                    singleLine = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = paymentMethodExpanded) },
                )
                ExposedDropdownMenu(
                    expanded = paymentMethodExpanded,
                    onDismissRequest = { paymentMethodExpanded = false },
                ) {
                    paymentMethodOptions.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option.label) },
                            onClick = {
                                paymentMethod = option.code
                                paymentMethodExpanded = false
                            },
                        )
                    }
                }
            }

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Catatan (opsional)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
            )

            Spacer(Modifier.weight(1f))

            Button(
                onClick = {
                    val parsedAmount = amount.toDoubleOrNull()
                    if (parsedAmount == null || parsedAmount <= 0.0) {
                        viewModel.submitPayment(0.0, paymentMethod, notes.ifBlank { null })
                        return@Button
                    }
                    viewModel.submitPayment(parsedAmount, paymentMethod, notes.ifBlank { null })
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading && amount.isNotBlank() && paymentMethod.isNotBlank(),
            ) {
                if (isLoading) CircularProgressIndicator(Modifier.size(20.dp))
                else Text("Simpan Pembayaran")
            }
        }
    }
}
