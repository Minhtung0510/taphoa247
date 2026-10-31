package com.dtff.gateway

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Quản lý lưu trữ cấu hình bảo mật bằng AES-256 trên thiết bị Android
 */
class Config(ctx: Context) {
    private val masterKey = MasterKey.Builder(ctx)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        ctx,
        "gateway_secure_cfg",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    var baseUrl: String
        get() = prefs.getString("baseUrl", "http://192.168.1.109:8000") ?: "http://192.168.1.109:8000"
        set(v) = prefs.edit().putString("baseUrl", v.trimEnd('/')).apply()

    var deviceId: String
        get() = prefs.getString("deviceId", "dev_test_android_01") ?: "dev_test_android_01"
        set(v) = prefs.edit().putString("deviceId", v.trim()).apply()

    var secret: String
        get() = prefs.getString("secret", "DTFF_SECRET_TEST_2026") ?: "DTFF_SECRET_TEST_2026"
        set(v) = prefs.edit().putString("secret", v.trim()).apply()

    var allowedPackages: Set<String>
        get() = prefs.getStringSet("pkgs", setOf(
            "com.tpb.mb.gprsandroid",      // TPBank Mobile
            "com.mbmobile",                // MBBank
            "com.VCB",                     // Vietcombank Digibank
            "com.simulator.bank"           // Giả lập test
        )) ?: emptySet()
        set(v) = prefs.edit().putStringSet("pkgs", v).apply()
}
