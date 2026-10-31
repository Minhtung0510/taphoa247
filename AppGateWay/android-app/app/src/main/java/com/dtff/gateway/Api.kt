package com.dtff.gateway

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Xử lý ký số HMAC-SHA256 và truyền tải HTTP an toàn
 */
object Api {
    private val client = OkHttpClient.Builder()
        .callTimeout(15, TimeUnit.SECONDS)
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private fun hex(bytes: ByteArray): String = bytes.joinToString("") { "%02x".format(it) }

    private fun sha256(input: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return hex(digest.digest(input.toByteArray(Charsets.UTF_8)))
    }

    private fun hmacSha256(key: String, data: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        val secretKey = SecretKeySpec(key.toByteArray(Charsets.UTF_8), "HmacSHA256")
        mac.init(secretKey)
        return hex(mac.doFinal(data.toByteArray(Charsets.UTF_8)))
    }

    /**
     * Gửi request có ký số HMAC và timestamp chống Replay Attack
     * @return HTTP status code
     */
    @Throws(IOException::class)
    fun post(cfg: Config, path: String, jsonBody: String): Int {
        val timestamp = (System.currentTimeMillis() / 1000).toString()
        val bodyHash = sha256(jsonBody)
        val payloadToSign = "$timestamp\n$bodyHash"
        val signature = hmacSha256(cfg.secret, payloadToSign)

        val url = cfg.baseUrl + path
        val request = Request.Builder()
            .url(url)
            .header("X-Device-Id", cfg.deviceId)
            .header("X-Timestamp", timestamp)
            .header("X-Signature", signature)
            .header("Authorization", "Bearer ${cfg.secret}") // Hỗ trợ cả 2 chế độ Basic & Signed
            .header("Content-Type", "application/json")
            .post(jsonBody.toRequestBody("application/json; charset=utf-8".toMediaType()))
            .build()

        client.newCall(request).execute().use { response ->
            return response.code
        }
    }
}
