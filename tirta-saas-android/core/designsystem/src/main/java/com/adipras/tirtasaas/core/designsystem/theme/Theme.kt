package com.adipras.tirtasaas.core.designsystem.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = TirtaPrimary,
    onPrimary = TirtaOnPrimary,
    primaryContainer = TirtaPrimaryContainer,
    onPrimaryContainer = TirtaOnPrimaryContainer,
    secondary = TirtaSecondary,
    background = TirtaBackground,
    surface = TirtaSurface,
)

@Composable
fun TirtaSaasTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        typography = TirtaTypography,
        content = content,
    )
}
