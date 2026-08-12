# ✦ WISH FREQUENCY · 소원 주파수

소원을 하나 정하면, 목적에 맞는 **주파수 몰입** · **타로 3장 해석** · **긍정 확언** · **소원 부적 카드**까지 한 번에 이어지는 웹/안드로이드 앱.

## 폴더 구조

```
.
├── web/                        # 웹앱 (앱의 실제 콘텐츠 · 단일 소스)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── data.js             # 정적 데이터(주파수·타로·확언·운세…)
│       └── app.js              # 앱 로직 전체
│
├── android/                    # 안드로이드 앱 (Android Studio 프로젝트)
│   ├── settings.gradle
│   ├── build.gradle
│   ├── gradle.properties
│   ├── gradle/wrapper/…
│   └── app/
│       ├── build.gradle        # ../web 를 assets/www 로 복사해 번들
│       ├── proguard-rules.pro
│       └── src/main/
│           ├── AndroidManifest.xml
│           ├── java/com/wishfrequency/app/
│           │   ├── MainActivity.kt   # WebView 로 웹앱 로드
│           │   └── WebAppBridge.kt   # 공유/저장 네이티브 브리지
│           └── res/…                 # 아이콘·테마·문자열
│
├── README.md
└── .gitignore
```

> 웹앱 코드는 **`web/` 한 곳에만** 둡니다. 안드로이드 빌드 시 Gradle 의 `copyWebAssets` 태스크가
> `web/` 를 `android/app/src/main/assets/www/` 로 자동 복사합니다. (그 복사본은 `.gitignore` 처리)

## 기능

- 감성 다크/글로우 UI, 모바일 반응형
- 소원 문장 → 키워드 기반 **주파수 추천** + Web Audio 실시간 재생, 청취 타이머
- **소원 타로**: 과거·현재·미래 3장 자동 스프레드 + 소원 맞춤 상세 해석
- **긍정 확언 팝업**: 소원 종류별 확언 3문장 · 3번 외치기
- **소원 성취 게이지 / 완료 세리머니(컨페티) / 오늘의 운세**
- **소원 부적 카드**: 소원·주파수·타로를 담은 PNG 생성 → 저장 / 공유
- **배경 사운드 믹스**: 빗소리·파도·화이트노이즈(실시간 합성) + 볼륨
- **공유**: 결과 텍스트 / 부적 이미지 (웹=Web Share API, 안드로이드=네이티브)

## 웹으로 실행

빌드 도구 없이 `web/index.html` 을 브라우저에서 열면 됩니다.
로컬 서버로 보려면(권장):

```bash
npx serve web
```

GitHub Pages 로 배포하려면 `web/` 폴더를 소스로 지정하세요.

## 안드로이드 앱 빌드 (Play Store 업로드용)

웹앱을 WebView 로 감싼 네이티브 앱입니다. **인터넷 권한이 없는 오프라인 앱**이라
개인정보 이슈가 적고, 모든 기능이 기기 내에서 동작합니다.

1. **Android Studio** 로 `android/` 폴더를 엽니다. (Gradle 동기화는 자동)
2. 실기기/에뮬레이터에서 **Run ▶** 으로 설치·실행 (앱 이름: *소원 주파수*)
3. 스토어 업로드용 서명 번들 생성:
   - `Build → Generate Signed Bundle / APK → Android App Bundle(.aab)`
   - 키스토어(서명 키) 생성 후 `release` 로 빌드 → 생성된 **.aab** 를 Play Console 에 업로드

명령줄 빌드(선택):

```bash
cd android
./gradlew bundleRelease      # AAB (스토어용)
./gradlew assembleDebug      # 디버그 APK
```

> 최초 빌드 전 `web/` 의 최신 내용이 자동 복사됩니다. 웹 코드를 고치면 다시 빌드만 하면 반영됩니다.

### 주요 설정
- `applicationId` : `com.wishfrequency.app` (스토어 등록 시 원하는 값으로 변경)
- `minSdk 26` (Android 8.0+) · `targetSdk 34` · `versionCode/Name` 은 `android/app/build.gradle`

## 다음 개발 단계

1. 소원 보관함(localStorage 기반 기록·이룸 체크)
2. 주파수 콘텐츠 확대 및 실제 오디오 트랙
3. 위젯 / 알림, 개인화
4. 광고 + 프리미엄 구독

> ※ 주파수·타로가 실제로 소원을 이루어주거나 미래를 예측한다는 과학적 근거는 없습니다.
> 본 서비스는 명상·몰입·재미를 위한 엔터테인먼트 콘텐츠입니다.
