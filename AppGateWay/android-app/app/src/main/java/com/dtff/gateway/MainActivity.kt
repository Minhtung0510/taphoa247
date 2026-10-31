package com.dtff.gateway

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import kotlinx.coroutines.*

class MainActivity : Activity() {
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val cfg = Config(this)

        // Giao diện đơn giản không cần layout XML cồng kềnh
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(40, 60, 40, 40)
            setBackgroundColor(android.graphics.Color.parseColor("#090D16"))
        }

        val title = TextView(this).apply {
            text = "⚡ DTFF SHOP GATEWAY"
            textSize = 20f
            setTextColor(android.graphics.Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
            setPadding(0, 0, 0, 30)
        }
        layout.addView(title)

        fun createLabel(text: String): TextView = TextView(this).apply {
            this.text = text
            setTextColor(android.graphics.Color.parseColor("#94A3B8"))
            textSize = 12f
            setPadding(0, 10, 0, 4)
        }

        fun createInput(initial: String): EditText = EditText(this).apply {
            setText(initial)
            setTextColor(android.graphics.Color.WHITE)
            setBackgroundColor(android.graphics.Color.parseColor("#111726"))
            setPadding(20, 20, 20, 20)
            textSize = 14f
        }

        layout.addView(createLabel("Server Webhook Base URL:"))
        val inputUrl = createInput(cfg.baseUrl)
        layout.addView(inputUrl)

        layout.addView(createLabel("Device UID:"))
        val inputDevice = createInput(cfg.deviceId)
        layout.addView(inputDevice)

        layout.addView(createLabel("Secret Key (Bảo mật):"))
        val inputSecret = createInput(cfg.secret)
        layout.addView(inputSecret)

        val btnSave = Button(this).apply {
            text = "💾 LƯU CẤU HÌNH"
            setBackgroundColor(android.graphics.Color.parseColor("#0284C7"))
            setTextColor(android.graphics.Color.WHITE)
            setOnClickListener {
                cfg.baseUrl = inputUrl.text.toString()
                cfg.deviceId = inputDevice.text.toString()
                cfg.secret = inputSecret.text.toString()
                Toast.makeText(this@MainActivity, "Đã lưu cấu hình an toàn!", Toast.LENGTH_SHORT).show()
            }
        }
        layout.addView(btnSave)

        val btnPerm = Button(this).apply {
            text = "🔔 1. CẤP QUYỀN ĐỌC THÔNG BÁO"
            setOnClickListener {
                startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            }
        }
        layout.addView(btnPerm)

        val btnBattery = Button(this).apply {
            text = "🔋 2. BỎ TỐI ƯU PIN (CHẠY NGẦM)"
            setOnClickListener {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            }
        }
        layout.addView(btnBattery)

        val btnService = Button(this).apply {
            text = "🟢 3. KHỞI ĐỘNG CHẠY 24/7"
            setBackgroundColor(android.graphics.Color.parseColor("#10B981"))
            setTextColor(android.graphics.Color.WHITE)
            setOnClickListener {
                startForegroundService(Intent(this@MainActivity, HeartbeatService::class.java))
                Toast.makeText(this@MainActivity, "Đã khởi chạy dịch vụ ngầm 24/7!", Toast.LENGTH_SHORT).show()
            }
        }
        layout.addView(btnService)

        val btnTest = Button(this).apply {
            text = "🚀 GỬI TEST 1 GIAO DỊCH GIẢ"
            setOnClickListener {
                scope.launch {
                    val code = withContext(Dispatchers.IO) {
                        try {
                            Api.post(
                                cfg,
                                "/api/v1/payments/device/webhook",
                                """{"app_package":"com.simulator.bank","title":"Test","raw_content":"GD: +50,000VND ND: ACC-XQR4R4TC","posted_at":"2026-10-28T15:00:00+07:00"}"""
                            )
                        } catch (e: Exception) {
                            -1
                        }
                    }
                    if (code in 200..299) {
                        Toast.makeText(this@MainActivity, "Gửi test thành công! (Mã $code)", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(this@MainActivity, "Gửi thất bại (Mã $code). Kiểm tra lại IP/Mạng Wi-Fi!", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
        layout.addView(btnTest)

        setContentView(layout)
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
}
