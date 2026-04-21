package com.adipras.tirtasaas.printerbridge.http

import com.adipras.tirtasaas.printerbridge.printer.ThermalPrinterDevice
import fi.iki.elonen.NanoHTTPD
import org.json.JSONArray
import org.json.JSONObject

class PrinterHttpServer(
    private val controller: PrinterBridgeController,
) : NanoHTTPD(HOSTNAME, PORT) {

    override fun serve(session: IHTTPSession): Response {
        return try {
            when {
                session.method == Method.OPTIONS -> jsonResponse(
                    Response.Status.OK,
                    JSONObject().put("success", true),
                )

                session.method == Method.GET && session.uri == "/status" -> {
                    jsonResponse(Response.Status.OK, controller.getBridgeStatus().toJson())
                }

                session.method == Method.GET && session.uri == "/printers" -> {
                    val printers = JSONArray()
                    controller.listPrinters().forEach { device: ThermalPrinterDevice ->
                        printers.put(device.toJson())
                    }

                    jsonResponse(
                        Response.Status.OK,
                        JSONObject()
                            .put("success", true)
                            .put("printers", printers)
                            .put("status", controller.getBridgeStatus().toJson().apply { remove("success") }),
                    )
                }

                session.method == Method.POST && session.uri == "/connect" -> {
                    val payload = parseJsonBody(session)
                    val deviceId = payload.optString("deviceId").ifBlank { null }
                    val result = controller.connectPrinter(deviceId)
                    jsonResponse(
                        if (result.success) Response.Status.OK else Response.Status.BAD_REQUEST,
                        result.toJson(),
                    )
                }

                session.method == Method.POST && session.uri == "/print" -> {
                    val payload = parseJsonBody(session)
                    val printPayload = when {
                        payload.has("type") -> payload
                        payload.has("payload") -> payload.optJSONObject("payload")
                        else -> null
                    }

                    if (printPayload == null) {
                        jsonResponse(
                            Response.Status.BAD_REQUEST,
                            JSONObject()
                                .put("success", false)
                                .put("message", "Payload cetak tidak ditemukan"),
                        )
                    } else {
                        val result = controller.printPayload(printPayload.toString())
                        jsonResponse(
                            if (result.success) Response.Status.OK else Response.Status.BAD_REQUEST,
                            result.toJson(),
                        )
                    }
                }

                else -> {
                    jsonResponse(
                        Response.Status.NOT_FOUND,
                        JSONObject()
                            .put("success", false)
                            .put("message", "Endpoint tidak ditemukan"),
                    )
                }
            }
        } catch (error: Exception) {
            jsonResponse(
                Response.Status.INTERNAL_ERROR,
                JSONObject()
                    .put("success", false)
                    .put("message", error.message ?: "Terjadi kesalahan internal"),
            )
        }
    }

    private fun parseJsonBody(session: IHTTPSession): JSONObject {
        val bodyFiles = mutableMapOf<String, String>()
        session.parseBody(bodyFiles)
        val rawBody = bodyFiles["postData"].orEmpty().trim()
        return if (rawBody.isBlank()) JSONObject() else JSONObject(rawBody)
    }

    private fun jsonResponse(status: Response.Status, payload: JSONObject): Response =
        newFixedLengthResponse(status, "application/json", payload.toString())
            .apply {
                addHeader("Access-Control-Allow-Origin", "*")
                addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                addHeader("Access-Control-Allow-Headers", "Content-Type")
                addHeader("Cache-Control", "no-store")
            }

    companion object {
        const val HOSTNAME = "127.0.0.1"
        const val PORT = 3000
    }
}
