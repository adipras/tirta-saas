package com.adipras.tirtasaas.mobile.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
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
private fun DashboardRoute(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = "Dashboard Mobile",
            style = MaterialTheme.typography.headlineSmall,
        )
        Text(
            text = "Login berhasil. Fitur dashboard akan tersedia pada fase berikutnya.",
            style = MaterialTheme.typography.bodyLarge,
        )
        Card {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("Modul awal")
                ModuleRow("app")
                ModuleRow("core/common")
                ModuleRow("core/designsystem")
                ModuleRow("core/network")
                ModuleRow("core/database")
                ModuleRow("core/security")
                ModuleRow("feature-auth")
            }
        }
        Button(onClick = onLogout) {
            Text("Keluar dari sesi demo")
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

fun topBarTitleForRoute(route: String?): String = when (route) {
    DASHBOARD_ROUTE -> "Dashboard Mobile"
    else -> "Masuk"
}
