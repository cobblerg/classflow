# ClassFlow Firebase 연동 가이드

이 문서는 ClassFlow 프로젝트를 **Firebase Web SDK**와 연결하기 위해 Firebase Console에서 수행해야 할 단계별 설정 가이드입니다.

비개발자나 초보자도 쉽게 따라 할 수 있도록 순서대로 설명합니다.

---

## 1. Firebase Console 접속

1. 웹 브라우저에서 [Firebase Console (https://console.firebase.google.com/)](https://console.firebase.google.com/)에 접속합니다.
2. 사용하실 Google 계정으로 로그인합니다.

---

## 2. 프로젝트 만들기

1. 화면 중앙의 **[프로젝트 만들기]** (또는 **[프로젝트 추가]**) 버튼을 클릭합니다.
2. **프로젝트 이름 입력**:
   - 예: `ClassFlow` 또는 원하는 이름 입력
   - 프로젝트 ID는 전 세계에서 고유해야 하므로, 자동으로 생성되는 고유 번호(예: `classflow-app-12345`)를 확인하고 **[계속]**을 클릭합니다.
3. **Google Analytics 설정**:
   - 현재 ClassFlow MVP에서는 분석 도구가 필수가 아닙니다.
   - 단순하고 빠른 연결을 위해 **"이 프로젝트에서 Google 애널리틱스 사용 설정"을 끄고(비활성화)** **[프로젝트 만들기]**를 클릭합니다.
4. 잠시 후 "새 프로젝트가 준비되었습니다" 메시지가 뜨면 **[계속]**을 클릭하여 프로젝트 대시보드로 이동합니다.

---

## 3. Web App 등록

1. 프로젝트 대시보드 중앙의 앱 추가 아이콘 중 **웹 아이콘 (`</>`)**을 클릭합니다.
2. **앱 등록**:
   - **앱 닉네임**: `ClassFlow Web` (자유롭게 입력 가능)
   - *"이 앱의 Firebase Hosting도 설정합니다"* 체크박스는 현재 단계에서 **체크하지 않고 비워둡니다**.
3. **[앱 등록]** 버튼을 클릭합니다.

---

## 4. Firebase Config 확인

앱 등록이 완료되면 화면에 `const firebaseConfig = { ... }` 형태의 스크립트가 나타납니다.

여기서 아래 6가지 키 값을 확인합니다:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef..."
};
```

*(이 창을 닫더라도 언제든지 **프로젝트 설정(톱니바퀴) > 일반 > 내 앱**에서 다시 확인할 수 있습니다.)*

---

## 5. .env.local 파일 만들기

1. VS Code 또는 편집기에서 ClassFlow 프로젝트 루트 폴더(`classflow_gpt`)를 엽니다.
2. 프로젝트 최상위 위치에 `.env.local` 파일을 새로 생성합니다.
   - 팁: 이미 준비된 `.env.example` 파일을 복사하여 파일명을 `.env.local`로 변경하셔도 됩니다.

---

## 6. 환경변수 입력

새로 만든 `.env.local` 파일에 4번에서 확인한 실제 값들을 아래 형식에 맞추어 붙여넣고 저장합니다:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_ACTUAL_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

> [!CAUTION]
> **보안 주의사항**:
> - `.env.local` 파일에는 실제 프로젝트 접속 키가 들어가므로 **절대로 GitHub 등 공개 저장소에 커밋하거나 공유하지 마세요**.
> - ClassFlow의 `.gitignore` 파일에 이미 `.env*` 보호 규칙이 적용되어 있어 자동으로 Git 추적에서 제외됩니다.
> - `NEXT_PUBLIC_` 접두사가 붙은 환경변수는 브라우저(클라이언트) 코드에서 접근할 수 있는 공개 식별 정보입니다. 향후 백엔드 전용 Secret Key(Service Account 등)를 다룰 때는 절대 `NEXT_PUBLIC_`을 붙이면 안 됩니다.

---

## 7. 개발 서버 재시작

Next.js 환경변수 파일(`.env.local`)을 새로 만들거나 수정한 후에는 반드시 **개발 서버를 재시작**해야 값이 정상적으로 적용됩니다.

1. 실행 중인 터미널 창에서 `Ctrl + C`를 눌러 개발 서버를 종료합니다.
2. 아래 명령어로 개발 서버를 다시 실행합니다:
   ```bash
   npm run dev
   ```

---

## 8. 연결 확인

1. 브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속합니다.
2. 브라우저 개발자 도구 콘솔(`F12` > Console) 또는 터미널을 확인합니다:
   - 환경변수가 올바르게 설정된 경우:
     ```text
     [ClassFlow Firebase] Initialized successfully. (Project: your-project-id)
     ```
   - 환경변수가 누락되었거나 비어 있는 경우:
     ```text
     [ClassFlow Firebase] Firebase configuration is missing or incomplete.
     ```
     경고가 나타나며, 기존 ClassFlow 로컬 기능(localStorage)은 정상 작동합니다.

---

## 9. 문제 해결 (FAQ)

### Q1. "Firebase App named '[DEFAULT]' already exists" 에러가 발생하나요?
- Next.js의 빠른 새로고침(Fast Refresh) 기능으로 인해 코드가 다시 실행될 때 발생하는 중복 초기화 문제입니다.
- ClassFlow의 `lib/firebase.ts` 모듈에 `getApps().length > 0 ? getApp() : initializeApp()` 방어 코드가 내장되어 있어 중복 초기화 오류가 발생하지 않습니다.

### Q2. Cloud Firestore나 Authentication도 지금 설정해야 하나요?
- **아닙니다.** 이번 STEP 19는 Firebase SDK 프로젝트 초기화 단계이므로 Firestore 데이터베이스나 로그인 설정은 아직 진행하지 않으셔도 됩니다. 다음 STEP 20에서 안내에 따라 안전하게 활성화할 예정입니다.

### Q3. 기존 데이터가 사라지나요?
- **아닙니다.** 현재 ClassFlow의 모든 기능(수업 개설, 수강생 명단, 진행도, 도움 요청, 피드백 등)은 브라우저 `localStorage`에서 계속 안전하게 동작합니다.
