package com.adipras.tirtasaas.kasirkeliling

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.adipras.tirtasaas.kasirkeliling.bridge.AndroidPrinterBridge
import com.adipras.tirtasaas.kasirkeliling.printer.ThermalPrinterManager

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var thermalPrinterManager: ThermalPrinterManager

    private val bluetoothPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        thermalPrinterManager = ThermalPrinterManager(this)
        webView = findViewById(R.id.webView)

        requestBluetoothPermissionsIfNeeded()
        setupWebView()
    }

    @Suppress("SetJavaScriptEnabled")
    private fun setupWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.settings.setSupportZoom(false)

        onBackPressedDispatcher.addCallback(this) {
            if (webView.canGoBack()) {
                webView.goBack()
            } else {
                finish()
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?,
            ) {
                if (request?.isForMainFrame == true) {
                    view?.loadDataWithBaseURL(
                        null,
                        """
                            <html>
                            <body style="font-family:sans-serif;padding:24px;">
                                <h3>Tirta SaaS Kasir Keliling</h3>
                                <p>Gagal memuat aplikasi web.</p>
                                <p>Periksa TIRTA_WEB_APP_URL pada gradle.properties dan pastikan URL dapat diakses dari perangkat Android.</p>
                            </body>
                            </html>
                        """.trimIndent(),
                        "text/html",
                        "utf-8",
                        null,
                    )
                }
            }
        }
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(
            AndroidPrinterBridge(thermalPrinterManager),
            "AndroidPrinterBridge",
        )

        webView.loadUrl(BuildConfig.WEB_APP_URL)
    }

    private fun requestBluetoothPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return
        }

        val permissions = listOf(
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.BLUETOOTH_SCAN,
        )

        val missingPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            bluetoothPermissionLauncher.launch(missingPermissions.toTypedArray())
        }
    }
}
