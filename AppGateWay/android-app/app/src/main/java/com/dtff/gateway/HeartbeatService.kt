package com.dtff.gateway

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.BatteryManager
import android.os.IBinder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import androidx.work.WorkQuery
import kotlinx.coroutines.*
import org.json.JSONObject

/**
 * Foreground Service gửi tín hiệu Heartbeat định kỳ 60 giây và giữ app chạy ngầm không bị kill
 */
class HeartbeatService : Service() {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val channelId = "dtff_gateway_channel"
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            channelId,
            "DTFF Payment Gateway",
            NotificationManager.IMPORTANCE_LOW
        )
        manager.createNotificationChannel(channel)

        val notification = Notification.Builder(this, channelId)
            .setContentTitle("Cổng thanh toán DTFF đang chạy ngầm")
            .setContentText("Đang lắng nghe biến động số dư ngân hàng 24/7...")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .build()

        startForeground(101, notification)

        scope.launch {
            while (isActive) {
                try {
                    val cfg = Config(applicationContext)
                    val bm = getSystemService(BatteryManager::class.java)
                    val battery = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

                    val pendingCount = WorkManager.getInstance(applicationContext).getWorkInfos(
                        WorkQuery.Builder.fromStates(listOf(WorkInfo.State.ENQUEUED, WorkInfo.State.RUNNING)).build()
                    ).get().size

                    val body = JSONObject().apply {
                        put("battery", battery)
                        put("network", "wifi/4g")
                        put("app_version", "1.0.0")
                        put("pending_queue", pendingCount)
                    }.toString()

                    Api.post(cfg, "/api/v1/payments/device/heartbeat", body)
                } catch (_: Exception) {}

                delay(60_000) // 60 giây gửi 1 lần
            }
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
}
