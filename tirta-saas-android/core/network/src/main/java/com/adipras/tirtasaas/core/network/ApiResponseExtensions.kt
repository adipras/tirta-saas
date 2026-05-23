package com.adipras.tirtasaas.core.network

class MissingApiDataException(
    message: String,
) : IllegalStateException(message)

fun <T> ApiResponse<T>.requireData(
    fallbackMessage: String,
): T = data ?: throw MissingApiDataException(message.ifBlank { fallbackMessage })

fun <T> PagedApiResponse<List<T>>.itemsOrEmpty(): List<T> = data.orEmpty()

fun PagedApiResponse<*>.totalItemsOrZero(): Int = meta?.totalItems ?: 0

fun Throwable.userMessage(
    fallbackMessage: String,
): String = message?.takeIf { it.isNotBlank() } ?: fallbackMessage
