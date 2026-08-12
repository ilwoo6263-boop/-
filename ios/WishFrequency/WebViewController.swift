import UIKit
import WebKit

/**
 소원 주파수 iOS 앱.
 번들에 포함된 web/index.html 을 WKWebView 로 로드하고,
 JS 의 window.webkit.messageHandlers.* 호출을 받아 공유/저장을 네이티브로 처리한다.
 (웹 코드는 안드로이드와 동일한 web/ 를 공유한다.)
 */
class WebViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {

    private var webView: WKWebView!

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let ucc = WKUserContentController()
        ucc.add(self, name: "shareText")
        ucc.add(self, name: "shareImage")
        ucc.add(self, name: "saveImage")
        config.userContentController = ucc

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.scrollView.backgroundColor = UIColor(red: 0.043, green: 0.039, blue: 0.078, alpha: 1) // #0B0A14
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        if let index = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") {
            webView.loadFileURL(index, allowingReadAccessTo: index.deletingLastPathComponent())
        }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    // MARK: - JS → 네이티브
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        switch message.name {
        case "shareText":
            if let text = message.body as? String { presentShare(items: [text]) }

        case "shareImage":
            if let dict = message.body as? [String: Any],
               let dataUrl = dict["dataUrl"] as? String,
               let image = decodeImage(dataUrl) {
                let text = dict["text"] as? String ?? ""
                presentShare(items: [image, text])
            }

        case "saveImage":
            if let dataUrl = message.body as? String, let image = decodeImage(dataUrl) {
                UIImageWriteToSavedPhotosAlbum(
                    image, self,
                    #selector(saveDone(_:didFinishSavingWithError:contextInfo:)), nil)
            }

        default:
            break
        }
    }

    // MARK: - 유틸
    private func decodeImage(_ dataUrl: String) -> UIImage? {
        guard let range = dataUrl.range(of: "base64,") else { return nil }
        let b64 = String(dataUrl[range.upperBound...])
        guard let data = Data(base64Encoded: b64) else { return nil }
        return UIImage(data: data)
    }

    private func presentShare(items: [Any]) {
        let vc = UIActivityViewController(activityItems: items, applicationActivities: nil)
        // iPad 대응
        vc.popoverPresentationController?.sourceView = view
        vc.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
        present(vc, animated: true)
    }

    @objc private func saveDone(_ image: UIImage, didFinishSavingWithError error: Error?, contextInfo: UnsafeRawPointer) {
        let msg = (error == nil) ? "사진 앱에 저장했어요 ✦" : "저장에 실패했어요"
        webView.evaluateJavaScript("window.toast && window.toast('\(msg)')", completionHandler: nil)
    }
}
