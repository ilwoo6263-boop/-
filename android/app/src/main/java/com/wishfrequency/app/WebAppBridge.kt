package com.wishfrequency.app

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

/**
 * 웹앱(JS)에서 window.AndroidBridge.* 로 호출하는 네이티브 브리지.
 * - shareText  : 소원/결과 텍스트 공유
 * - shareImage : 소원 부적 카드(PNG) 이미지 공유
 * - saveImage  : 소원 부적 카드(PNG)를 갤러리에 저장
 */
class WebAppBridge(private val activity: Activity) {

    /** data:image/png;base64,... 형태의 문자열을 바이트로 디코드 */
    private fun decode(dataUrl: String): ByteArray {
        val idx = dataUrl.indexOf("base64,")
        val pure = if (idx >= 0) dataUrl.substring(idx + 7) else dataUrl
        return Base64.decode(pure, Base64.DEFAULT)
    }

    private fun toastUi(msg: String) = activity.runOnUiThread {
        Toast.makeText(activity, msg, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun shareText(text: String) = activity.runOnUiThread {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
        }
        activity.startActivity(Intent.createChooser(intent, "공유하기"))
    }

    @JavascriptInterface
    fun shareImage(dataUrl: String, text: String) {
        try {
            val bytes = decode(dataUrl)
            val dir = File(activity.cacheDir, "shared").apply { mkdirs() }
            val file = File(dir, "talisman.png")
            file.writeBytes(bytes)
            val uri = FileProvider.getUriForFile(
                activity, "${activity.packageName}.fileprovider", file
            )
            activity.runOnUiThread {
                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = "image/png"
                    putExtra(Intent.EXTRA_STREAM, uri)
                    putExtra(Intent.EXTRA_TEXT, text)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                activity.startActivity(Intent.createChooser(intent, "부적 공유하기"))
            }
        } catch (e: Exception) {
            toastUi("공유 중 오류가 발생했어요")
        }
    }

    @JavascriptInterface
    fun saveImage(dataUrl: String) {
        val bytes = decode(dataUrl)
        val name = "소원부적_${System.currentTimeMillis()}.png"
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ : MediaStore 로 갤러리(Pictures/WishFrequency)에 저장, 권한 불필요
                val values = ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, name)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                    put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/WishFrequency")
                }
                val resolver = activity.contentResolver
                val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { it.write(bytes) }
                    toastUi("갤러리에 저장했어요 ✦")
                } else {
                    toastUi("저장에 실패했어요")
                }
            } else {
                // Android 9 이하 : 앱 전용 외부 저장소(권한 불필요)
                val dir = File(activity.getExternalFilesDir(null), "WishFrequency").apply { mkdirs() }
                File(dir, name).writeBytes(bytes)
                toastUi("저장했어요 ✦")
            }
        } catch (e: Exception) {
            toastUi("저장 중 오류가 발생했어요")
        }
    }
}
