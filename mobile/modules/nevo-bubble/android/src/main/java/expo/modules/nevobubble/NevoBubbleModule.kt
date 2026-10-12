package expo.modules.nevobubble

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings as AndroidSettings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NevoBubbleModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NevoBubble")

    Events("onBubbleDismissed")

    OnCreate {
      NevoBubbleController.onDismissRequested = {
        sendEvent("onBubbleDismissed", mapOf("reason" to "user"))
      }
    }

    AsyncFunction("start") { config: Map<String, Any?> ->
      val context = appContextOrNull() ?: return@AsyncFunction null
      NevoBubbleController.start(context, config)
      null
    }

    AsyncFunction("stop") {
      val context = appContextOrNull() ?: return@AsyncFunction null
      NevoBubbleController.stop(context)
      null
    }

    AsyncFunction("update") { config: Map<String, Any?> ->
      val context = appContextOrNull() ?: return@AsyncFunction null
      NevoBubbleController.update(context, config)
      null
    }

    AsyncFunction("canDrawOverlays") {
      val context = appContextOrNull() ?: return@AsyncFunction false
      AndroidSettings.canDrawOverlays(context)
    }

    AsyncFunction("openOverlaySettings") {
      val context = appContextOrNull() ?: return@AsyncFunction null
      val intent = Intent(
        AndroidSettings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${context.packageName}"),
      )
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      null
    }
  }

  private fun appContextOrNull(): Context? {
    appContext.reactContext?.applicationContext?.let {
      return it
    }
    appContext.activityProvider?.currentActivity?.applicationContext?.let {
      return it
    }
    return null
  }
}
