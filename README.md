# ClassFlow (클래스플로우) 🎓
> **학생의 배움이 한눈에 보이는 실시간 교실 대시보드**

ClassFlow는 강사(교사)와 수강생(학생)이 함께 수업을 진행하며, 실시간으로 학습 진행 상황과 체감 난이도를 확인하고 도움이 필요한 학생을 즉시 지원할 수 있도록 돕는 웹 기반 교육 플랫폼입니다.

---

## 🌟 핵심 기능 소개

### 1. 📊 학습 진행도 격자판 (Progress Grid)
- **전체 현황 한눈에 파악**: 참여자(수강생) 명단과 차시 목록을 격자 형태로 표시하여 교실 전체의 학습 진도를 즉시 파악합니다.
- **다차원 상태 표시**:
  - ⚪ **시작 전** / 🟡 **진행 중** / 🟢 **과제 완료**
  - 🔴 **도움 필요** (진행 상태보다 최우선으로 눈에 띄게 표시)
  - 🤔 **어려움** (보조 표시로 난이도 체감 파악)
  - 🔒 **비공개 차시** (수강생 접근 차단)
- **대규모 수업 지원**: 30명 × 20차시(600개 셀) 이상의 수업에서도 빠른 성능을 보장합니다.

### 2. 🚨 실시간 도움 요청 대기열 (Help Queue)
- **즉각적인 조치 지원**: 수강생이 보낸 도움 요청과 자가진단 "도움 필요" 상태를 자동으로 모아 강사 대시보드 최상단에 띄웁니다.
- **스마트 우선순위 & 중복 제거**:
  1. 🙋 **직접 도움 요청** (수강생이 작성한 질문 메시지 포함)
  2. 🆘 **도움 필요** (자가진단 결과)
  3. 🤔 **어려움** (자가진단 결과)
  - 동일 차시에서 직접 요청과 도움 필요가 동시에 있어도 1개의 카드로 깔끔하게 합쳐서 보여줍니다.
- **✓ 도움 완료**: 강사가 [도움 완료]를 클릭하면 즉시 대기열에서 처리되며, 학생의 자가진단 상태는 유지되어 "추가 확인 필요" 여부를 계속 챙길 수 있습니다.

### 3. 🔗 6자리 코드로 쉬운 다중 기기 입장
- 강사가 개설한 강의의 **6자리 강의 코드**(예: `K7P4XR`)만 입력하면, 별도의 복잡한 회원가입 없이 수강생이 자신의 스마트폰, 태블릿, 노트북 등 어떤 기기에서든 바로 수업에 참여할 수 있습니다.

### 4. ⚡ Cloud Firestore 실시간 동기화
- 수강생이 다른 기기에서 진행 상태나 도움 요청을 누르면 강사 화면에서 **새로고침(F5)을 누르지 않아도 즉시 실시간으로 반영**됩니다.
- 오프라인/로컬 테스트를 위한 **Demo 모드**도 함께 제공합니다.

---

## 🧭 주요 화면 안내 (경로)

| 주소 (URL) | 화면 이름 | 설명 |
| :--- | :--- | :--- |
| `/` | **홈 화면** | 새 수업 만들기, 저장된 수업 열기, 코드로 수업 입장하기 |
| `/setup` | **강의 개설 화면** | 강의명, 수강생 수, 차시 수, 역할 명칭(교사/강사 등) 설정 |
| `/join` | **수강생 입장 화면** | 6자리 강의 코드를 입력하여 다른 기기에서 원격 강의 입장 |
| `/teacher` | **강사 대시보드** | 실시간 Help Queue 대기열 및 Progress Grid 격자판 |
| `/teacher/student/...` | **수강생 상세 보기** | 특정 수강생의 차시별 학습 상태, 도움 요청 이력 확인 |
| `/student` | **수강생 대시보드** | 본인의 차시 목록 및 과제 진행 상태 카드 확인 |
| `/student/.../lesson/...` | **차시 과제 상세** | 학습 목표 확인, 진행 상태 변경, 난이도 선택, 도움 요청 |

---

## 🛠 기술 스택

- **프레임워크**: [Next.js](https://nextjs.org/) (App Router)
- **언어**: [TypeScript](https://www.typescriptlang.org/)
- **스타일링**: [Tailwind CSS](https://tailwindcss.com/)
- **데이터베이스 & 실시간 엔진**: [Google Cloud Firestore](https://firebase.google.com/docs/firestore)
- **로컬 저장소**: 브라우저 `localStorage` 및 `sessionStorage` (데모 및 세션 분리)

---

## 🚀 시작하기 (로컬 개발 환경)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경변수 설정 (`.env.local`)
프로젝트 루트 위치에 `.env.local` 파일을 생성하고 Firebase Web App 연결 키를 입력합니다. (참고: `.env.example`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 실행 결과를 확인합니다.

### 4. 프로덕션 빌드 및 검증
```bash
npm run build
```

---

## 📋 현재 개발 현황 (STEP 26 완료)

- [x] **STEP 1~18**: 단일 브라우저 로컬 MVP 및 UI 컴포넌트 완성 (그리드, 대기열, 상세 보기 등)
- [x] **STEP 19~22**: Firebase Web App 연동 및 강의 개설 시 Firestore `courses`, `participants`, `lessons` 저장
- [x] **STEP 23**: 6자리 강의 코드 기반 다중 기기/브라우저 원격 입장 (`/join`) 구현
- [x] **STEP 24**: 수강생 Progress(진행 상태) 및 Understanding(이해도) Firestore 저장 및 F5 복원
- [x] **STEP 25**: 수강생 직접 도움 요청(HelpRequest) 생성, 취소, 재요청 및 대기 상태 동기화
- [x] **STEP 26**: 강사 대시보드 Progress Grid 및 Help Queue의 Firestore 실시간 리스너(`onSnapshot`) 연동 및 [도움 완료] 액션 처리
- [ ] **STEP 27 (예정)**: 차시 공개/비공개 및 수강생 정보 Firestore 실시간 동기화
