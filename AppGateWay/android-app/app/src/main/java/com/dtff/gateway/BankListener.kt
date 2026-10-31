package com.dtff.gateway

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import kotlinx.coroutines.*
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

/**
 * Lắng nghe thông báo hệ thống, lọc chính xác thông báo từ app ngân hàng có tiền vào (+)
 * Hỗ trợ Fast-Path gửi tức thì (<100ms) + WorkManager bền vững làm dự phòng khi rớt mạng
 */
class BankListener : NotificationListenerService() {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val cfg = Config(this)
        val packageName = sbn.packageName

        // 1. Chỉ xử lý các app ngân hàng nằm trong danh sách cho phép
        if (packageName !in cfg.allowedPackages) return

        val extras = sbn.notification.extras
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
        
        // Bắt toàn diện: EXTRA_BIG_TEXT, EXTRA_TEXT, EXTRA_SUB_TEXT, EXTRA_TEXT_LINES (khi TPBank gom nhóm thông báo)
        val textLines = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.joinToString("\n") ?: ""
        val body = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
            ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString().orEmpty()

        val fullContent = if (textLines.isNotEmpty()) "$body\n$textLines" else body

        // 2. Chỉ bắt thông báo tiền vào (có ký tự + hoặc PS:+)
        if (!Regex("""(?:\+|PS:\s*\+)""").containsMatchIn(fullContent) && !Regex("""(?:\+|PS:\s*\+)""").containsMatchIn(title)) return

        // 3. Sinh event_id cố định theo nội dung và thời gian của thông báo (idempotent)
        val eventId = UUID.nameUUIDFromBytes(
            "$packageName|${sbn.postTime}|$fullContent".toByteArray(Charsets.UTF_8)
        ).toString()

        // 4. FAST-PATH: Gửi trực tiếp tức thì qua mạng (<100ms)
        scope.launch {
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("Asia/Ho_Chi_Minh")
            }
            val postedAtIso = isoFormat.format(Date(sbn.postTime))

            val json = JSONObject().apply {
                put("event_id", eventId)
                put("app_package", packageName)
                put("title", title)
                put("raw_content", fullContent)
                put("posted_at", postedAtIso)
            }.toString()

            var sentSuccessfully = false
            try {
                val code = Api.post(cfg, "/api/v1/payments/device/webhook", json)
                if (code in 200..299) {
                    sentSuccessfully = true
                }
            } catch (_: Exception) {}

            // Nếu gửi ngay lập tức thất bại (mạng lag/mất Wi-Fi), tự động đẩy vào WorkManager retry bền vững
            if (!sentSuccessfully) {
                Sender.enqueue(this@BankListener, eventId, packageName, title, fullContent, sbn.postTime)
            }
        }
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
}
