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
import com.adipras.tirtasaas.feature.tenant.tenantDetailScreen
import com.adipras.tirtasaas.feature.tenant.tenantListScreen
import com.adipras.tirtasaas.feature.user.UserListDestination
import com.adipras.tirtasaas.feature.user.userListScreen

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
        userListScreen()
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
            onLogout = onLogout,
        )
    }
}

@Composable
private fun DashboardRoute(
    onNavigateToCustomers: () -> Unit,
    onNavigateToTenants: () -> Unit,
    onNavigateToUsers: () -> Unit,
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
    else -> "Masuk"
}
