package com.adipras.tirtasaas.feature.usage

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

object DraftSyncNotifier {
    private const val CHANNEL_ID = "draft_usage_sync"
    private const val CHANNEL_NAME = "Sinkronisasi Draft"

    fun notifySuccess(context: Context, draftId: String) {
        notify(
            context = context,
            draftId = draftId,
            title = "Draft berhasil disinkronkan",
            message = "Data pemakaian draft sudah terkirim ke server.",
        )
    }

    fun notifyFailure(context: Context, draftId: String) {
        notify(
            context = context,
            draftId = draftId,
            title = "Sinkronisasi draft gagal",
            message = "Periksa koneksi lalu coba lagi dari menu pemakaian.",
        )
    }

    private fun notify(
        context: Context,
        draftId: String,
        title: String,
        message: String,
    ) {
        if (!canNotify(context)) return

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        ensureChannel(manager)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true)
            .build()

        manager.notify("draft-sync-$draftId".hashCode(), notification)
    }

    private fun canNotify(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS,
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    private fun ensureChannel(manager: NotificationManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT,
            )
            manager.createNotificationChannel(channel)
        }
    }
}
