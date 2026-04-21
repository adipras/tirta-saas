package com.adipras.tirtasaas.printerbridge.printer

import org.json.JSONObject

data class ThermalPrinterDevice(
    val id: String,
    val name: String,
    val address: String,
) {
    fun toJson(): JSONObject =
        JSONObject()
            .put("id", id)
            .put("name", name)
            .put("address", address)
}
