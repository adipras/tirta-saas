package com.adipras.tirtasaas.mobile.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.adipras.tirtasaas.feature.auth.LoginDestination
import com.adipras.tirtasaas.feature.auth.loginScreen
import com.adipras.tirtasaas.feature.customer.CustomerDetailDestination
import com.adipras.tirtasaas.feature.customer.CustomerListDestination
import com.adipras.tirtasaas.feature.customer.customerDetailScreen
import com.adipras.tirtasaas.feature.customer.customerListScreen
import com.adipras.tirtasaas.feature.tenant.TenantDetailDestination
import com.adipras.tirtasaas.feature.tenant.TenantListDestination
import com.adipras.tirtasaas.feature.tenant.TenantSettingsDestination
import com.adipras.tirtasaas.feature.tenant.tenantDetailScreen
import com.adipras.tirtasaas.feature.tenant.tenantListScreen
import com.adipras.tirtasaas.feature.tenant.tenantSettingsScreen
import com.adipras.tirtasaas.feature.user.UserListDestination
import com.adipras.tirtasaas.feature.user.userListScreen
import com.adipras.tirtasaas.feature.usage.UsageListDestination
import com.adipras.tirtasaas.feature.usage.UsageFormDestination
import com.adipras.tirtasaas.feature.usage.usageListScreen
import com.adipras.tirtasaas.feature.usage.usageFormScreen
import com.adipras.tirtasaas.feature.invoice.InvoiceListDestination
import com.adipras.tirtasaas.feature.invoice.InvoiceDetailDestination
import com.adipras.tirtasaas.feature.invoice.invoiceListScreen
import com.adipras.tirtasaas.feature.invoice.invoiceDetailScreen
import com.adipras.tirtasaas.feature.payment.PaymentInputDestination
import com.adipras.tirtasaas.feature.payment.paymentInputScreen
import com.adipras.tirtasaas.feature.printer.PrinterDestination
import com.adipras.tirtasaas.feature.printer.printerScreen

private const val DASHBOARD_ROUTE = "dashboard"

@Composable
fun TirtaNavHost(
    navController: NavHostController,
    innerPadding: PaddingValues,
    onLogout: () -> Unit,
) {
    NavHost(
        navController = navController,
        startDestination = LoginDestination.route,
        modifier = Modifier.padding(innerPadding),
    ) {
        loginGraph(navController)
        dashboardGraph(navController, onLogout)
        customerListScreen(
            onCustomerClick = { customerId ->
                navController.navigate(CustomerDetailDestination.createRoute(customerId))
            },
        )
        customerDetailScreen(
            onBack = { navController.popBackStack() },
        )
        tenantListScreen(
            onTenantClick = { tenantId ->
                navController.navigate(TenantDetailDestination.createRoute(tenantId))
            },
        )
        tenantDetailScreen(
            onBack = { navController.popBackStack() },
        )
        tenantSettingsScreen(
            onBack = { navController.popBackStack() },
        )
        userListScreen()
        usageListScreen(
            onNavigateToForm = { usageId ->
                navController.navigate(UsageFormDestination.createRoute(usageId))
            },
        )
        usageFormScreen(
            onSaved = { navController.popBackStack() },
            onBack = { navController.popBackStack() },
        )
        invoiceListScreen(
            onNavigateToDetail = { invoiceId ->
                navController.navigate(InvoiceDetailDestination.createRoute(invoiceId))
            },
        )
        invoiceDetailScreen(
            onBack = { navController.popBackStack() },
            onNavigateToPrinter = { invoiceId ->
                navController.navigate(PrinterDestination.createRoute(invoiceId))
            },
        )
        paymentInputScreen(
            onSaved = { navController.popBackStack() },
            onBack = { navController.popBackStack() },
        )
        printerScreen(
            onBack = { navController.popBackStack() },
        )
    }
}

private fun NavGraphBuilder.loginGraph(navController: NavHostController) {
    loginScreen(
        onLoginSuccess = {
            navController.navigate(DASHBOARD_ROUTE) {
                popUpTo(LoginDestination.route) {
                    inclusive = true
                }
            }
        },
    )
}

private fun NavGraphBuilder.dashboardGraph(
    navController: NavHostController,
    onLogout: () -> Unit,
) {
    composable(route = DASHBOARD_ROUTE) {
        DashboardRoute(
            onNavigateToCustomers = {
                navController.navigate(CustomerListDestination.route)
            },
            onNavigateToTenants = {
                navController.navigate(TenantListDestination.route)
            },
            onNavigateToUsers = {
                navController.navigate(UserListDestination.route)
            },
            onNavigateToUsages = {
                navController.navigate(UsageListDestination.route)
            },
            onNavigateToInvoices = {
                navController.navigate(InvoiceListDestination.route)
            },
            onNavigateToSettings = {
                navController.navigate(TenantSettingsDestination.route)
            },
            onLogout = onLogout,
        )
    }
}

@Composable
private fun DashboardRoute(
    onNavigateToCustomers: () -> Unit,
    onNavigateToTenants: () -> Unit,
    onNavigateToUsers: () -> Unit,
    onNavigateToUsages: () -> Unit,
    onNavigateToInvoices: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = "Dashboard",
            style = MaterialTheme.typography.headlineSmall,
        )
        Button(onClick = onNavigateToCustomers, modifier = Modifier.fillMaxWidth()) {
            Text("Daftar Pelanggan")
        }
        Button(
            onClick = onNavigateToTenants,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Daftar Tenant")
        }
        Button(
            onClick = onNavigateToUsers,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Manajemen Pengguna")
        }
        Button(
            onClick = onNavigateToUsages,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Pemakaian Air")
        }
        Button(
            onClick = onNavigateToInvoices,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Tagihan")
        }
        Button(
            onClick = onNavigateToSettings,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Pengaturan")
        }
        Button(onClick = onLogout) {
            Text("Keluar")
        }
    }
}

@Composable
private fun ModuleRow(name: String) {
    Row {
        Text("\u2022 ")
        Text(name)
    }
}

fun topBarTitleForRoute(route: String?): String = when {
    route == DASHBOARD_ROUTE -> "Dashboard"
    route?.startsWith(CustomerDetailDestination.routeBase + "/") == true -> "Detail Pelanggan"
    route?.startsWith(CustomerListDestination.route) == true -> "Pelanggan"
    route?.startsWith(TenantDetailDestination.routeBase + "/") == true -> "Detail Tenant"
    route?.startsWith(TenantListDestination.route) == true -> "Manajemen Tenant"
    route?.startsWith(UserListDestination.route) == true -> "Pengguna"
    route?.startsWith(UsageListDestination.route) == true -> "Pemakaian Air"
    route?.startsWith(UsageFormDestination.route) == true -> "Form Pemakaian"
    route?.startsWith(InvoiceListDestination.route) == true -> "Tagihan"
    route?.startsWith(InvoiceDetailDestination.routeBase + "/") == true -> "Detail Tagihan"
    route?.startsWith(PaymentInputDestination.routeBase + "/") == true -> "Input Pembayaran"
    route?.startsWith(PrinterDestination.routeBase + "/") == true -> "Cetak Struk"
    route?.startsWith(TenantSettingsDestination.route) == true -> "Pengaturan"
    else -> "Masuk"
}
