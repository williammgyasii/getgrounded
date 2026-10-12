package expo.modules.nevobubble

import android.content.Context
import android.content.Intent
import android.graphics.Outline
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewOutlineProvider
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs

object NevoBubbleController {
  private val mainHandler = Handler(Looper.getMainLooper())
  var onDismissRequested: (() -> Unit)? = null
  private var overlayView: View? = null
  private var titleView: TextView? = null
  private var hintView: TextView? = null
  private var windowManager: WindowManager? = null
  private var deepLink: String = "getgroundedapp://plan"
  private var layoutParams: WindowManager.LayoutParams? = null
  private var overlayLayoutRevision: Int = 0

  fun start(context: Context, config: Map<String, Any?>) {
    update(context, config)
  }

  fun stop(context: Context) {
    val app = context.applicationContext
    mainHandler.post { removeOverlayInternal(app) }
    app.stopService(Intent(app, NevoBubbleService::class.java))
  }

  fun dismissFromUser(context: Context) {
    val app = context.applicationContext
    mainHandler.post {
      removeOverlayInternal(app)
      app.stopService(Intent(app, NevoBubbleService::class.java))
      onDismissRequested?.invoke()
    }
  }

  fun update(context: Context, config: Map<String, Any?>) {
    val app = context.applicationContext
    ensureForegroundService(app)
    mainHandler.post { applyUpdate(app, config) }
  }

  private fun ensureForegroundService(app: Context) {
    val intent = Intent(app, NevoBubbleService::class.java)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        app.startForegroundService(intent)
      } else {
        app.startService(intent)
      }
    } catch (_: IllegalStateException) {
      // App in background on some API levels — overlay may still update when allowed.
    }
  }

  private fun applyUpdate(context: Context, config: Map<String, Any?>) {
    deepLink = config["deepLink"] as? String ?: deepLink
    val label = (config["label"] as? String)?.trim().orEmpty().ifEmpty { "Your plan" }
    val hint = (config["hint"] as? String)?.trim().orEmpty().ifEmpty { "Tap to open" }
    val layoutRevision =
      when (val raw = config["layoutRevision"]) {
        is Number -> raw.toInt()
        else -> 0
      }

    if (!SettingsHelper.canDraw(context)) {
      return
    }

    if (overlayView != null && layoutRevision != overlayLayoutRevision) {
      removeOverlayInternal(context)
    }

    if (overlayView != null && titleView != null) {
      titleView?.text = label
      hintView?.text = hint
      overlayView?.contentDescription = "$label. $hint. Hide chip on the right."
      return
    }

    if (overlayView != null) {
      removeOverlayInternal(context)
    }

    showOverlay(context, label, hint, layoutRevision)
  }

  private fun showOverlay(context: Context, label: String, hint: String, layoutRevision: Int) {
    overlayLayoutRevision = layoutRevision
    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    windowManager = wm
    val density = context.resources.displayMetrics.density
    val avatarPx = (44 * density).toInt()
    val padH = (10 * density).toInt()
    val padV = (8 * density).toInt()

    val row =
      LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(padH, padV, padH, padV)
        background = context.getDrawable(R.drawable.nevo_bubble_pill)
        contentDescription = "$label. $hint"
      }

    val avatar = ImageView(context)
    avatar.setImageResource(R.drawable.nevo_avatar)
    avatar.scaleType = ImageView.ScaleType.CENTER_CROP
    avatar.background = context.getDrawable(R.drawable.nevo_bubble_ring)
    avatar.clipToOutline = true
    avatar.outlineProvider =
      object : ViewOutlineProvider() {
        override fun getOutline(view: View, outline: Outline) {
          outline.setOval(0, 0, view.width, view.height)
        }
      }
    row.addView(avatar, LinearLayout.LayoutParams(avatarPx, avatarPx))

    val textCol =
      LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        setPadding((10 * density).toInt(), 0, (4 * density).toInt(), 0)
      }

    val title =
      TextView(context).apply {
        text = label
        setTextColor(0xFFE8E2D8.toInt())
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
        typeface = Typeface.DEFAULT_BOLD
        maxLines = 2
        ellipsize = android.text.TextUtils.TruncateAt.END
        maxWidth = (180 * density).toInt()
      }
    titleView = title
    textCol.addView(title)

    val hintText =
      TextView(context).apply {
        text = hint
        setTextColor(0xFF9AA3B5.toInt())
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        maxLines = 1
        ellipsize = android.text.TextUtils.TruncateAt.END
      }
    hintView = hintText
    textCol.addView(hintText)

    row.addView(
      textCol,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ),
    )

    val closeSize = (32 * density).toInt()
    val close =
      TextView(context).apply {
        text = "✕"
        setTextColor(0xFFE8E2D8.toInt())
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
        gravity = Gravity.CENTER
        contentDescription = "Hide Nevo chip"
        background = context.getDrawable(R.drawable.nevo_bubble_close)
        elevation = 8f
        setOnClickListener { dismissFromUser(context) }
      }

    val container =
      LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(0, 0, (4 * density).toInt(), 0)
      }
    container.addView(
      row,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ),
    )
    container.addView(
      close,
      LinearLayout.LayoutParams(closeSize, closeSize).apply {
        marginStart = (6 * density).toInt()
      },
    )

    val type =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      } else {
        @Suppress("DEPRECATION")
        WindowManager.LayoutParams.TYPE_PHONE
      }

    val params =
      WindowManager.LayoutParams(
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        type,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
        PixelFormat.TRANSLUCENT,
      )
    params.gravity = Gravity.TOP or Gravity.END
    params.x = (16 * density).toInt()
    params.y = (160 * density).toInt()

    var initialX = 0
    var initialY = 0
    var touchX = 0f
    var touchY = 0f

    row.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          initialX = params.x
          initialY = params.y
          touchX = event.rawX
          touchY = event.rawY
          true
        }
        MotionEvent.ACTION_MOVE -> {
          params.x = initialX - (event.rawX - touchX).toInt()
          params.y = initialY + (event.rawY - touchY).toInt()
          wm.updateViewLayout(container, params)
          true
        }
        MotionEvent.ACTION_UP -> {
          if (abs(event.rawX - touchX) < 12 && abs(event.rawY - touchY) < 12) {
            DeepLinkHelper.open(context, deepLink)
          }
          true
        }
        else -> false
      }
    }

    wm.addView(container, params)
    overlayView = container
    layoutParams = params
  }

  private fun removeOverlayInternal(context: Context) {
    val wm = windowManager ?: context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    overlayView?.let {
      try {
        wm.removeView(it)
      } catch (_: IllegalArgumentException) {
        // Already removed.
      }
    }
    overlayView = null
    titleView = null
    hintView = null
    layoutParams = null
  }
}

private object SettingsHelper {
  fun canDraw(context: Context): Boolean = android.provider.Settings.canDrawOverlays(context)
}

private object DeepLinkHelper {
  fun open(context: Context, url: String) {
    val uri = Uri.parse(url)
    val viewIntent =
      Intent(Intent.ACTION_VIEW, uri).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        setPackage(context.packageName)
      }
    try {
      context.startActivity(viewIntent)
      return
    } catch (_: Exception) {
      // Fall back to launcher with deep link data.
    }

    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
    if (launch != null) {
      launch.data = uri
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      context.startActivity(launch)
    }
  }
}
