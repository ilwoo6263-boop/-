# WebView JS 인터페이스는 난독화에서 제외 (JS에서 이름으로 호출)
-keepclassmembers class com.wishfrequency.app.WebAppBridge {
    @android.webkit.JavascriptInterface <methods>;
}
