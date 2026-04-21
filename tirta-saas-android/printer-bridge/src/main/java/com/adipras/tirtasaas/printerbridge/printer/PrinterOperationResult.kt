package com.adipras.tirtasaas.printerbridge.printer

import org.json.JSONObject

data class PrinterOperationResult(
    val success: Boolean,
    val message: String,
    val status: PrinterBridgeStatus,
) {
    fun toJson(): JSONObject =
        JSONObject()
            .put("success", success)
            .put("message", message)
            .put("status", status.toJson().apply { remove("success") })
}
