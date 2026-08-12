package com.wishfrequency.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

/**
 * 소원 주파수 안드로이드 앱.
 * assets/www 안의 웹앱(index.html)을 WebView 로 로드해서 그대로 구동한다.
 * 공유/저장 등 네이티브가 필요한 기능은 WebAppBridge 를 통해 JS 에서 호출한다.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true                 // 앱 로직
            domStorageEnabled = true                 // localStorage (기록/보관함용)
            mediaPlaybackRequiresUserGesture = false // Web Audio 재생
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        // JS 에서 window.AndroidBridge.* 로 호출
        webView.addJavascriptInterface(WebAppBridge(this), "AndroidBridge")

        webView.loadUrl("file:///android_asset/www/index.html")

        // 뒤로가기: 웹 히스토리가 있으면 웹에서 뒤로, 없으면 앱 종료
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }
}
