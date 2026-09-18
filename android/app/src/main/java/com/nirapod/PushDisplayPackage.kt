package com.nirapod

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PushDisplayPackage : ReactPackage {
  @Deprecated("ReactPackage.createNativeModules is a legacy bridge API.")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(PushDisplayModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
