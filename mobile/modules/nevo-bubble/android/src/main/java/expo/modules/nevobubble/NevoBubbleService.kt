package expo.modules.nevobubble

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class NevoBubbleService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    promoteForeground()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    promoteForeground()
    return START_STICKY
  }

  private fun promoteForeground() {
    val channelId = "nevo_bubble"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel =
        NotificationChannel(channelId, "Nevo nearby", NotificationManager.IMPORTANCE_LOW)
      channel.setShowBadge(false)
      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }

    val launch =
      packageManager.getLaunchIntentForPackage(packageName)?.let { launchIntent ->
        PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_IMMUTABLE)
      }

    val notification: Notification =
      NotificationCompat.Builder(this, channelId)
        .setContentTitle("Nevo on screen")
        .setContentText("Your next task chip is active")
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentIntent(launch)
        .setOngoing(true)
        .setSilent(true)
        .build()

    startForeground(9101, notification)
  }

  override fun onDestroy() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    super.onDestroy()
  }
}
