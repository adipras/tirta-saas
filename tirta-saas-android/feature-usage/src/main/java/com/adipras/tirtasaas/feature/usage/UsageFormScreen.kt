package com.adipras.tirtasaas.feature.usage

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument

object UsageFormDestination {
    const val route = "usage_form"
    const val ARG = "usageId"
    val routeWithArg = "$route?$ARG={$ARG}"
    fun createRoute(usageId: String?) = if (usageId != null) "$route?$ARG=$usageId" else route
}

fun NavGraphBuilder.usageFormScreen(onSaved: () -> Unit, onBack: () -> Unit) {
    composable(
        route = UsageFormDestination.routeWithArg,
        arguments = listOf(navArgument(UsageFormDestination.ARG) {
            type = NavType.StringType
            nullable = true
            defaultValue = null
        }),
    ) { backStackEntry ->
        val usageId = backStackEntry.arguments?.getString(UsageFormDestination.ARG)
        UsageFormScreen(usageId = usageId, onSaved = onSaved, onBack = onBack)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UsageFormScreen(
    usageId: String? = null,
    onSaved: () -> Unit,
    onBack: () -> Unit,
    viewModel: UsageFormViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state.saveSuccess) {
        if (state.saveSuccess) onSaved()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (usageId == null) "Tambah Pemakaian" else "Edit Pemakaian") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Kembali")
                    }
                },
            )
        },
    ) { padding ->
        if (state.isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        Column(
            Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            OutlinedTextField(
                value = state.customerId,
                onValueChange = viewModel::onCustomerIdChange,
                label = { Text("Customer ID") },
                modifier = Modifier.fillMaxWidth(),
                enabled = usageId == null,
                singleLine = true,
            )
            OutlinedTextField(
                value = state.usageMonth,
                onValueChange = viewModel::onUsageMonthChange,
                label = { Text("Bulan Pemakaian (YYYY-MM)") },
                modifier = Modifier.fillMaxWidth(),
                enabled = usageId == null,
                singleLine = true,
                placeholder = { Text("Contoh: 2025-01") },
            )
            OutlinedTextField(
                value = state.meterEnd,
                onValueChange = viewModel::onMeterEndChange,
                label = { Text("Meter Akhir (m³)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = state.notes,
                onValueChange = viewModel::onNotesChange,
                label = { Text("Catatan (opsional)") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 3,
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = state.isDraft, onCheckedChange = viewModel::onDraftChange)
                Text("Simpan sebagai draft")
            }

            if (state.error != null) {
                Text(state.error ?: "", color = MaterialTheme.colorScheme.error)
            }

            Button(
                onClick = viewModel::save,
                enabled = !state.isSaving,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (state.isSaving) CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp))
                Text(if (usageId == null) "Simpan" else "Perbarui")
            }
        }
    }
}
