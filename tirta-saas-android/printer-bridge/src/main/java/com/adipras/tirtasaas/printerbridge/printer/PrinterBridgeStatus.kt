package com.adipras.tirtasaas.printerbridge.printer

import org.json.JSONObject

data class PrinterBridgeStatus(
    val bridgeRunning: Boolean,
    val connected: Boolean,
    val message: String,
    val serverUrl: String = "http://127.0.0.1:3000",
    val printerName: String? = null,
    val printerAddress: String? = null,
    val preferredPrinterId: String? = null,
    val preferredPrinterName: String? = null,
) {
    fun toJson(): JSONObject {
        val json = JSONObject()
            .put("success", true)
            .put("bridgeRunning", bridgeRunning)
            .put("connected", connected)
            .put("message", message)
            .put("serverUrl", serverUrl)

        printerName?.let { json.put("printerName", it) }
        printerAddress?.let { json.put("printerAddress", it) }
        preferredPrinterId?.let { json.put("preferredPrinterId", it) }
        preferredPrinterName?.let { json.put("preferredPrinterName", it) }
        return json
    }
}
