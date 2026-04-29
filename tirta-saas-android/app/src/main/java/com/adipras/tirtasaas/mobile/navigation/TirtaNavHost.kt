package com.adipras.tirtasaas.mobile.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
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
import com.adipras.tirtasaas.feature.customer.CustomerListDestination
import com.adipras.tirtasaas.feature.customer.customerListScreen

private const val DASHBOARD_ROUTE = "dashboard"

@Composable
fun TirtaNavHost(
    navController: NavHostController,
    innerPadding: PaddingValues,
) {
    NavHost(
        navController = navController,
        startDestination = LoginDestination.route,
        modifier = Modifier.padding(innerPadding),
    ) {
        loginGraph(navController)
        dashboardGraph(navController)
        customerListScreen(
            onCustomerClick = { /* TODO: navigate to detail */ },
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

private fun NavGraphBuilder.dashboardGraph(navController: NavHostController) {
    composable(route = DASHBOARD_ROUTE) {
        DashboardRoute(
            onNavigateToCustomers = {
                navController.navigate(CustomerListDestination.route)
            },
            onLogout = {
                navController.navigate(LoginDestination.route) {
                    popUpTo(DASHBOARD_ROUTE) {
                        inclusive = true
                    }
                }
            },
        )
    }
}

@Composable
private fun DashboardRoute(
    onNavigateToCustomers: () -> Unit,
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
        Button(onClick = onNavigateToCustomers, modifier = Modifier.fillMaxSize().weight(1f, false)) {
            Text("Daftar Pelanggan")
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
    route?.startsWith(CustomerListDestination.route) == true -> "Pelanggan"
    else -> "Masuk"
}
