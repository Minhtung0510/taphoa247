package com.dtff.gateway

import android.content.Context
import androidx.work.*
import org.json.JSONObject
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

/**
 * Xử lý hàng đợi gửi Webhook bất đồng bộ, bền vững qua WorkManager
 */
object Sender {
    fun enqueue(ctx: Context, eventId: String, pkg: String, title: String, body: String, postTime: Long) {
        val inputData = workDataOf(
            "event_id" to eventId,
            "pkg" to pkg,
            "title" to title,
            "body" to body,
            "post_time" to postTime
        )

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val request = OneTimeWorkRequestBuilder<SendWorker>()
            .setInputData(inputData)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .addTag("payment_webhook")
            .build()

        // KEEP: Nếu cùng 1 thông báo đang nằm trong hàng đợi thì không tạo trùng
        WorkManager.getInstance(ctx).enqueueUniqueWork(
            "tx-$eventId",
            ExistingWorkPolicy.KEEP,
            request
        )
    }
}

class SendWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val cfg = Config(applicationContext)
        val postTime = inputData.getLong("post_time", System.currentTimeMillis())
        val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("Asia/Ho_Chi_Minh")
        }
        val postedAtIso = isoFormat.format(Date(postTime))

        val json = JSONObject().apply {
            put("event_id", inputData.getString("event_id"))
            put("app_package", inputData.getString("pkg"))
            put("title", inputData.getString("title"))
            put("raw_content", inputData.getString("body"))
            put("posted_at", postedAtIso)
        }.toString()

        return try {
            val code = Api.post(cfg, "/api/v1/payments/device/webhook", json)
            when (code) {
                in 200..299 -> Result.success()
                422 -> Result.failure() // Payload lỗi định dạng, không cần retry
                else -> Result.retry()  // 401, 429, 5xx: Thử lại sau theo chính sách lũy thừa
            }
        } catch (e: IOException) {
            Result.retry() // Lỗi mất mạng: Tự động giữ hàng đợi và retry khi có mạng
        } catch (e: Exception) {
            Result.failure()
        }
    }
}
