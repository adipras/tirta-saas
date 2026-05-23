package com.adipras.tirtasaas.mobile

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.adipras.tirtasaas.core.designsystem.theme.TirtaSaasTheme
import com.adipras.tirtasaas.feature.auth.LoginDestination
import com.adipras.tirtasaas.mobile.navigation.TirtaNavHost
import com.adipras.tirtasaas.mobile.navigation.topBarTitleForRoute
import com.adipras.tirtasaas.mobile.ui.TirtaTopBar

@Composable
fun TirtaSaasApp() {
    TirtaSaasTheme {
        val sessionViewModel: AppSessionViewModel = hiltViewModel()
        val sessionUiState by sessionViewModel.uiState.collectAsStateWithLifecycle()
        val navController = rememberNavController()
        val backStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = backStackEntry?.destination?.route

        LaunchedEffect(sessionUiState.isAuthenticated, currentRoute) {
            when {
                sessionUiState.isAuthenticated && currentRoute == LoginDestination.route -> {
                    navController.navigate("dashboard") {
                        popUpTo(LoginDestination.route) {
                            inclusive = true
                        }
                    }
                }

                !sessionUiState.isAuthenticated && currentRoute != null && currentRoute != LoginDestination.route -> {
                    navController.navigate(LoginDestination.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            inclusive = true
                        }
                        launchSingleTop = true
                    }
                }
            }
        }

        Scaffold(
            topBar = {
                TirtaTopBar(title = topBarTitleForRoute(backStackEntry?.destination?.route))
            },
        ) { innerPadding ->
            TirtaNavHost(
                navController = navController,
                innerPadding = innerPadding,
                sessionUiState = sessionUiState,
                onLogout = sessionViewModel::logout,
            )
        }

        if (sessionUiState.isTenantBlocked) {
            AlertDialog(
                onDismissRequest = {},
                title = { Text("Akses tenant tidak tersedia") },
                text = { Text(sessionUiState.blockedTenantMessage ?: "Akses tenant sedang dibatasi.") },
                confirmButton = {
                    Button(onClick = sessionViewModel::clearBlockedSession) {
                        Text("Kembali ke login")
                    }
                },
            )
        }
    }
}
