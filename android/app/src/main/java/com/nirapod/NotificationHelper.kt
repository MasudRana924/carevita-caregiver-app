package com.nirapod

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object NotificationHelper {
  const val CHANNEL_ID = "caremate_default"

  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val existing = manager.getNotificationChannel(CHANNEL_ID)
    if (existing != null) {
      return
    }
    val channel =
      NotificationChannel(
        CHANNEL_ID,
        context.getString(R.string.default_notification_channel_name),
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = "Bookings, identity verification, and account alerts"
        enableVibration(true)
        setShowBadge(true)
      }
    manager.createNotificationChannel(channel)
  }

  fun show(context: Context, title: String, body: String, type: String?) {
    ensureChannel(context)
    val launch =
      Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        putExtra("notification_type", type ?: "")
      }
    val pendingFlags =
      PendingIntent.FLAG_UPDATE_CURRENT or
        (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    val pendingIntent =
      PendingIntent.getActivity(
        context,
        (type ?: title).hashCode(),
        launch,
        pendingFlags,
      )

    val notification =
      NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title.ifBlank { context.getString(R.string.app_name) })
        .setContentText(body)
        .setStyle(NotificationCompat.BigTextStyle().bigText(body))
        .setAutoCancel(true)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setDefaults(NotificationCompat.DEFAULT_ALL)
        .setContentIntent(pendingIntent)
        .build()

    NotificationManagerCompat.from(context).notify((type ?: title).hashCode(), notification)
  }
}
