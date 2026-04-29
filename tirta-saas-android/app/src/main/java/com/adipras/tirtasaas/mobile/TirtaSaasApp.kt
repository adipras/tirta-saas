package com.adipras.tirtasaas.mobile

import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.adipras.tirtasaas.core.designsystem.theme.TirtaSaasTheme
import com.adipras.tirtasaas.mobile.navigation.TirtaNavHost
import com.adipras.tirtasaas.mobile.navigation.topBarTitleForRoute
import com.adipras.tirtasaas.mobile.ui.TirtaTopBar

@Composable
fun TirtaSaasApp() {
    TirtaSaasTheme {
        val navController = rememberNavController()
        val backStackEntry by navController.currentBackStackEntryAsState()

        Scaffold(
            topBar = {
                TirtaTopBar(title = topBarTitleForRoute(backStackEntry?.destination?.route))
            },
        ) { innerPadding ->
            TirtaNavHost(
                navController = navController,
                innerPadding = innerPadding,
            )
        }
    }
}
