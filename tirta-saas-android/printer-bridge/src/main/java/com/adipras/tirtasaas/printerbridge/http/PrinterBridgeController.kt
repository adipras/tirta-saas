package com.adipras.tirtasaas.printerbridge.http

import com.adipras.tirtasaas.printerbridge.printer.PrinterBridgeStatus
import com.adipras.tirtasaas.printerbridge.printer.PrinterOperationResult
import com.adipras.tirtasaas.printerbridge.printer.ThermalPrinterDevice

interface PrinterBridgeController {
    fun getBridgeStatus(): PrinterBridgeStatus

    fun listPrinters(): List<ThermalPrinterDevice>

    fun connectPrinter(deviceId: String?): PrinterOperationResult

    fun printPayload(payloadJson: String): PrinterOperationResult
}
