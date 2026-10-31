package com.dtff.gateway

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Tự động bật lại HeartbeatService khi điện thoại khởi động lại
 */
class BootReceiver : BroadcastReceiver {
    constructor() : super()

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val serviceIntent = Intent(context, HeartbeatService::class.java)
            context.startForegroundService(serviceIntent)
        }
    }
}
