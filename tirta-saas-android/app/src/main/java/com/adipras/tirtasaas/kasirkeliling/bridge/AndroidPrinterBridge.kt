package com.adipras.tirtasaas.kasirkeliling.bridge

import android.webkit.JavascriptInterface
import com.adipras.tirtasaas.kasirkeliling.printer.ThermalPrinterManager

class AndroidPrinterBridge(
    private val thermalPrinterManager: ThermalPrinterManager,
) {
    @JavascriptInterface
    fun isAvailable(): Boolean = true

    @JavascriptInterface
    fun scanPrinters(): String = thermalPrinterManager.getPairedPrintersJson()

    @JavascriptInterface
    fun connectPrinter(deviceId: String): String = thermalPrinterManager.connect(deviceId)

    @JavascriptInterface
    fun getStatus(): String = thermalPrinterManager.getStatusJson()

    @JavascriptInterface
    fun printReceipt(payloadJson: String): String = thermalPrinterManager.printReceipt(payloadJson)
}
