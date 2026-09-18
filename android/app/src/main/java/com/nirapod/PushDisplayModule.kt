package com.nirapod

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PushDisplayModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "PushDisplay"

  @ReactMethod
  fun show(title: String?, body: String?, type: String?) {
    NotificationHelper.show(
      reactContext,
      title ?: "Nirapod",
      body ?: "",
      type,
    )
  }
}
