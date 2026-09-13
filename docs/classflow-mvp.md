# ClassFlow DB 없는 MVP 개발 패키지 v2.0
## Google Antigravity 기반 · 범용 수업형 · DB 없는 프로토타입

---

# 0. 문서 목적

이 문서는 **Google Antigravity를 활용하여 ClassFlow의 핵심 UX를 빠르게 검증하기 위한 DB 없는 MVP 개발 명세**이다.

이번 MVP에서는 Supabase, Database, 실제 인증, RLS, 실시간 다중 사용자 동기화를 구현하지 않는다.

핵심 목표는 다음 질문을 검증하는 것이다.

> **교사가 수업 중 ClassFlow 화면을 보고 5초 안에 “지금 누구에게 도움이 필요한가?”를 판단할 수 있는가?**

이번 버전은 특정 학급이나 특정 차시 수에 고정하지 않는다.

사용자가 수업을 시작할 때 다음 정보를 직접 입력하여 **범용으로 사용할 수 있는 구조**로 만든다.

- 수업명
- 학생 수
- 차시 수
- 학생 이름
- 차시 제목

---

# PART 1. PRD Lite

## 1. 제품명

**ClassFlow**

### 슬로건

**학생의 배움이 보이는 교실**

---

## 2. 제품 목적

학생들이 각자의 속도로 과제를 수행하는 수업에서 교사가 학생별 진행 상황과 이해 정도를 한 화면에서 확인하고, 도움이 필요한 학생을 빠르게 발견할 수 있도록 한다.

---

## 3. 핵심 가설

ClassFlow MVP는 다음 가설을 검증한다.

> 학생별 진행 상황과 도움 필요 여부를 Grid와 Help Queue로 시각화하면 교사는 수업 중 도움이 필요한 학생을 빠르게 발견할 수 있다.

### MVP 성공 기준

아래 조건을 만족하면 핵심 가설이 1차적으로 검증된 것으로 본다.

1. 실제 교사 또는 동료 교사 **최소 3명**에게 Dashboard를 5초 동안 보여준다.
2. 화면을 숨긴 뒤 다음 질문을 한다.
   - “도움이 필요한 학생은 누구였나요?”
   - “가장 먼저 도와야 할 학생은 누구라고 생각하나요?”
3. 최소 3명 중 2명 이상이 도움 필요 학생을 정확히 찾는다.
4. “화면에서 학생 상태를 파악하기 쉬웠다”는 평가를 5점 척도에서 평균 **4점 이상** 받는다.
5. 사용자가 Help Queue와 Grid 중 어느 정보가 더 도움이 되었는지 기록한다.

### 추가 관찰 항목

- 도움 필요 학생을 찾는 데 걸린 시간
- 잘못 판단한 학생 수
- Grid 상태 아이콘의 의미를 직관적으로 이해했는지
- 태블릿에서 스크롤과 Cell 선택이 불편하지 않은지
- 교사가 원하는 추가 정보가 무엇인지

---

# 4. MVP 사용자

## Teacher

교사는 전체 학생의 진행 상황과 도움 요청을 확인한다.

## Student

학생은 자신의 차시별 과제를 확인하고 진행 상태와 이해도를 입력한다.

---

# 5. 실제 사용 맥락

ClassFlow는 수업 중 다음 환경에서 사용하는 것을 기본 가정으로 한다.

### 교사

주 사용 환경:

- 교사용 노트북
- 데스크톱 PC
- 태블릿

보조 환경:

- 프로젝터 또는 대형 화면

### 학생

주 사용 환경:

- 태블릿
- 노트북
- 데스크톱

### UI 설계 원칙

- 태블릿에서도 Cell을 쉽게 누를 수 있어야 한다.
- 최소 클릭 영역은 충분히 크게 만든다.
- 색상만으로 상태를 표현하지 않는다.
- 학생 이름 열은 sticky 처리한다.
- 차시가 많을 때 가로 스크롤을 허용한다.
- 학생 수가 많을 때 세로 스크롤을 허용한다.
- 세로 스크롤 시 **차시 Header 행도 sticky** 처리한다.
- 도움 필요 상태는 멀리서도 식별 가능해야 한다.

---

# 6. MVP에서 구현할 기능

## Teacher

- 초기 수업 설정
- 수업명 입력
- 학생 수 입력
- 차시 수 입력
- 학생 이름 입력 또는 자동 생성
- 차시 제목 입력 또는 자동 생성
- 학생 × 차시 Dashboard
- 진행 상태 확인
- 이해 상태 확인
- Help Queue
- 학생 상세 Side Panel
- 차시 공개/비공개 토글
- 테스트용 학생 화면 이동
- 전체 테스트 데이터 초기화

## Student

- 테스트할 학생 선택
- 자신의 차시 목록 확인
- 공개된 차시 확인
- 과제 내용 확인
- 진행 상태 변경
- 이해도 선택
- 결과물 작성
- 질문 작성
- 도움 요청
- 도움 요청 취소
- 교사 피드백 확인

---

# 7. 이번 MVP에서 구현하지 않을 것

```text
❌ Supabase
❌ 서버 Database
❌ 실제 회원가입
❌ 실제 학생 로그인
❌ 교사 인증
❌ RLS
❌ Edge Function
❌ 여러 기기 간 실시간 동기화
❌ 실제 학생 개인정보 운영
❌ 파일 업로드
❌ Google 로그인
❌ Microsoft 로그인
```

중요:

> 이 MVP는 기능 검증용 프로토타입이다.  
> 실제 수업에서 사용할 경우 가상 학생명 또는 비식별 테스트 데이터를 사용하는 것을 권장한다.

---

# PART 2. 범용 초기 설정

## 8. 초기 설정 화면

처음 실행하면 바로 Dashboard가 아니라 **수업 설정 화면**을 보여준다.

Route:

```text
/setup
```

입력 항목:

### 수업명

예:

```text
AI와 피지컬 컴퓨팅
```

### 학생 수

예:

```text
25
```

권장 범위:

```text
1 ~ 40명
```

### 차시 수

예:

```text
15
```

권장 범위:

```text
1 ~ 30차시
```

버튼:

```text
[ 수업 만들기 ]
```

---

# 9. 학생 및 차시 자동 생성

학생 수를 25명으로 입력하면:

```text
01 학생01
02 학생02
03 학생03
...
25 학생25
```

를 자동 생성한다.

차시 수를 15로 입력하면:

```text
1차시
2차시
3차시
...
15차시
```

를 자동 생성한다.

이후 사용자가 이름과 제목을 수정할 수 있다.

---

# 10. 초기 설정 후 편집

수업 생성 직후 간단한 편집 화면을 제공한다.

### 학생 이름

예:

```text
01 [ 김민수 ]
02 [ 이서연 ]
03 [ 박지우 ]
```

### 차시 제목

예:

```text
1차시 [ LED 켜기 ]
2차시 [ LED 깜빡이기 ]
3차시 [ 버튼으로 LED 제어하기 ]
```

MVP에서는 학생 수와 차시 수를 다시 변경할 수 있도록 한다.

단, 감소시키는 경우 기존 데이터가 삭제될 수 있으므로 다음 확인을 표시한다.

```text
차시 수를 줄이면 삭제되는 차시의 테스트 데이터가 함께 사라집니다.

[취소] [계속]
```

---

# PART 3. 핵심 사용자 흐름

## 11. 전체 흐름

```text
Home
 ↓
새 수업 만들기
 ↓
수업명 / 학생 수 / 차시 수
 ↓
학생·차시 정보 확인 및 수정
 ↓
Teacher Dashboard
 ↓
Student 화면 테스트
 ↓
상태 변경 / 도움 요청
 ↓
Teacher Dashboard 확인
```

---

# 12. 교사 흐름

```text
Teacher Dashboard
 ↓
Help Queue 확인
 ↓
학생 × 차시 Cell 클릭
 ↓
Student Detail Panel
 ↓
학생 질문 / 결과물 확인
 ↓
피드백 작성
 ↓
도움 완료
```

---

# 13. 학생 흐름

MVP에는 실제 인증이 없다.

```text
학생 화면
 ↓
테스트할 학생 선택
 ↓
학생 Dashboard
 ↓
공개된 차시 선택
 ↓
진행 상태 변경
 ↓
이해도 선택
 ↓
필요 시 도움 요청
```

---

# PART 4. 상태 모델과 전이 규칙

## 14. 진행 상태

```ts
type ProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed";
```

학생은 상태를 앞뒤로 모두 변경할 수 있다.

허용:

```text
시작 전 → 진행 중
진행 중 → 완료
완료 → 진행 중
진행 중 → 시작 전
```

이유:

MVP에서는 학생이 실수로 상태를 변경했거나 과제를 다시 수정하는 상황을 허용한다.

---

# 15. 이해 상태

```ts
type Understanding =
  | "understood"
  | "difficult"
  | "need_help"
  | null;
```

학생이 원하는 시점에 이해 상태를 변경할 수 있다.

---

# 16. HelpRequest 상태

```ts
type HelpRequestStatus =
  | "waiting"
  | "resolved"
  | "cancelled";
```

전이:

```text
학생 도움 요청
→ waiting

학생이 요청 취소
waiting → cancelled

교사가 도움 완료
waiting → resolved
```

---

# 17. “도움 완료” 규칙

교사가 **도움 완료**를 눌러도 `understanding` 값을 자동으로 `understood`로 바꾸지 않는다.

이유:

교사가 도움을 주었다고 해서 학생이 반드시 이해한 것은 아니기 때문이다.

대신:

```text
HelpRequest.status
waiting → resolved
```

만 변경한다.

학생의 `understanding = need_help`가 여전히 남아 있다면 Help Queue에는 다음 형태로 표시한다.

```text
😐 추가 확인 필요
```

따라서 교사는 학생에게 이해 상태를 다시 선택하도록 안내할 수 있다.

---

# 18. Help Queue 중복 처리 규칙

한 학생이 같은 차시에서:

```text
understanding = need_help
```

이고 동시에:

```text
HelpRequest.status = waiting
```

이어도 Help Queue에는 **한 번만 표시한다.**

두 신호를 하나의 Queue Item으로 합친다.

예:

```text
03 박지우
3차시
🙋 직접 도움 요청 · 🆘 도움 필요
```

---

# 19. Help Queue 우선순위

정렬 기준:

### 1순위

직접 Help Request가 `waiting` 상태인 학생

### 2순위

`understanding = need_help`인 학생

### 3순위

`understanding = difficult`인 학생

같은 우선순위 안에서는:

```text
가장 오래 기다린 학생
→ 최근 학생
```

순서로 정렬한다.

즉:

```text
priority ASC
requestedAt ASC
```

개념으로 구현한다.

`need_help`나 `difficult`에 별도 요청 시간이 없다면 해당 이해 상태가 마지막으로 변경된 `updatedAt`을 사용한다.

---

# PART 5. 화면 구조

## 20. Route 구조

```text
/

├── /setup
│
├── /teacher
│
├── /student
│
└── /student/[studentId]
```

---

# 21. Home

```text
┌─────────────────────────────────────┐
│                                     │
│             ClassFlow               │
│                                     │
│      학생의 배움이 보이는 교실       │
│                                     │
│       [ 새 수업 만들기 ]             │
│                                     │
│       [ 저장된 테스트 수업 열기 ]    │
│                                     │
└─────────────────────────────────────┘
```

저장된 데이터가 없으면 두 번째 버튼은 비활성화한다.

---

# 22. Setup 화면

```text
┌─────────────────────────────────────┐
│ ClassFlow · 수업 설정                │
│                                     │
│ 수업명                              │
│ [ AI와 피지컬 컴퓨팅             ]  │
│                                     │
│ 학생 수                             │
│ [ 25 ]                              │
│                                     │
│ 차시 수                             │
│ [ 15 ]                              │
│                                     │
│           [ 수업 만들기 ]            │
└─────────────────────────────────────┘
```

---

# 23. Teacher Dashboard

```text
┌───────────────────────────────────────────────────┐
│ ClassFlow                     AI와 피지컬 컴퓨팅    │
│ [수업 설정] [학생 화면] [데이터 초기화]            │
│                                                   │
│ 학생 25명    진행 중 8    완료 10   🚨 도움 필요 3│
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ 🚨 도움이 필요한 학생                        │ │
│ │ 03 박지우 │ 3차시 │ 🙋 6분 대기              │ │
│ │ 07 김서준 │ 4차시 │ 🆘 도움 필요             │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ 학생       1차시  2차시  3차시 ... 15차시       │
│ ──────────────────────────────────────────────── │
│ 01 김민수   🟢     🟢     🟡          🔒          │
│ 02 이서연   🟢     🟢     🟢          🔒          │
│ 03 박지우   🟢     🟢     🔴          🔒          │
│ ...                                               │
└───────────────────────────────────────────────────┘
```

### Sticky 규칙

- 첫 번째 학생 이름 열: `sticky left-0`
- 차시 Header: `sticky top-0`
- 좌상단 학생 Header: 가로·세로 모두 sticky
- Grid 본문은 가로/세로 스크롤 가능

---

# 24. 차시 공개/비공개 UI

Teacher Dashboard의 차시 Header를 클릭하면 작은 메뉴 또는 Popover를 표시한다.

예:

```text
3차시
버튼으로 LED 제어하기

● 공개
○ 비공개

[차시 정보 수정]
```

또는 Header에 직접:

```text
3차시  🔓
```

아이콘을 제공한다.

클릭 시:

```text
🔓 공개 ↔ 🔒 비공개
```

전환한다.

MVP 기본값:

- 첫 번째 차시는 공개
- 나머지는 사용자가 설정할 수 있음

초기 Demo Data가 필요하면 일부 공개 상태를 자동 배치할 수 있다.

---

# 25. Help Queue

```text
🚨 도움이 필요한 학생

03 박지우
3차시 · 버튼으로 LED 제어하기
🙋 직접 도움 요청
6분 대기
[확인]

07 김서준
4차시 · 부저 제어
🆘 도움이 필요해요
[확인]
```

---

# 26. Student Detail Side Panel

```text
┌──────────────────────────────┐
│ 03 박지우               ✕    │
│                              │
│ 3차시                        │
│ 버튼으로 LED 제어하기         │
│                              │
│ 진행 상태                    │
│ 🟡 진행 중                   │
│                              │
│ 이해도                       │
│ 🆘 도움 필요                 │
│                              │
│ 도움 요청                    │
│ 🙋 6분 전                    │
│                              │
│ 질문                         │
│ LED가 계속 켜져 있어요.       │
│                              │
│ 결과물                       │
│ from machine import Pin ...  │
│                              │
│ 교사 피드백                  │
│ [                         ]  │
│                              │
│ [피드백 저장]                │
│ [✓ 도움 완료]                │
└──────────────────────────────┘
```

---

# 27. Student 선택 화면

```text
⚠ MVP 테스트 모드
실제 인증 기능이 없습니다.

학생을 선택하세요.

01 학생01
02 학생02
03 학생03
...
```

학생 수에 따라 자동 렌더링한다.

---

# 28. Student Dashboard

```text
안녕하세요, 학생03

나의 학습

🟢 1차시 완료
🟡 2차시 진행 중
⚪ 3차시 시작 전
🔒 4차시 비공개
...
```

차시 수에 따라 자동으로 렌더링한다.

---

# 29. Student Lesson 화면

```text
3차시
버튼으로 LED 제어하기

🎯 학습 목표
...

📋 과제
...

진행 상태
[시작 전] [진행 중] [완료]

이해도
[😊 이해했어요]
[😐 조금 어려워요]
[🆘 도움이 필요해요]

결과물
[                            ]

질문
[                            ]

[저장]

[🙋 선생님, 도와주세요]
```

---

# PART 6. 데이터 구조

## 30. ClassSettings

```ts
type ClassSettings = {
  className: string;
  studentCount: number;
  lessonCount: number;
  createdAt: string;
};
```

---

# 31. Student

```ts
type Student = {
  id: string;
  number: number;
  name: string;
};
```

학생 수를 기준으로 동적 생성한다.

---

# 32. Lesson

```ts
type Lesson = {
  id: string;
  number: number;
  title: string;
  objective: string;
  description: string;
  published: boolean;
};
```

---

# 33. Progress

```ts
type ProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed";

type Understanding =
  | "understood"
  | "difficult"
  | "need_help"
  | null;

type Progress = {
  studentId: string;
  lessonId: string;
  status: ProgressStatus;
  understanding: Understanding;
  updatedAt: string;
};
```

---

# 34. Submission

```ts
type Submission = {
  studentId: string;
  lessonId: string;
  content: string;
  question: string;
  updatedAt: string;
};
```

---

# 35. HelpRequest

```ts
type HelpRequest = {
  id: string;
  studentId: string;
  lessonId: string;
  message: string;
  status: "waiting" | "resolved" | "cancelled";
  requestedAt: string;
  resolvedAt?: string;
};
```

---

# 36. Feedback

```ts
type Feedback = {
  studentId: string;
  lessonId: string;
  content: string;
  updatedAt: string;
};
```

---

# 37. 전체 상태

```ts
type ClassFlowData = {
  settings: ClassSettings;
  students: Student[];
  lessons: Lesson[];
  progress: Progress[];
  submissions: Submission[];
  helpRequests: HelpRequest[];
  feedback: Feedback[];
};
```

---

# PART 7. localStorage

## 38. 저장 Key

```text
classflow-mvp-data
```

---

# 39. 저장 대상

- 수업 설정
- 학생
- 차시
- Progress
- Submission
- Help Request
- Feedback

---

# 40. 데이터 초기화

Teacher Dashboard 상단에:

```text
[ 데이터 초기화 ]
```

버튼을 제공한다.

클릭하면 Confirm Dialog:

```text
ClassFlow 테스트 데이터를 모두 초기화하시겠습니까?

이 작업은 되돌릴 수 없습니다.

[취소] [초기화]
```

초기화 후:

```text
localStorage.removeItem("classflow-mvp-data")
```

를 수행하고 `/setup`으로 이동한다.

---

# PART 8. 테스트용 Demo Data

범용성이 핵심이므로 제품 자체는 학생 수와 차시 수를 고정하지 않는다.

다만 개발 확인용으로 **Demo Data 생성 버튼**을 제공해도 좋다.

예:

```text
[ 데모 데이터로 시작 ]
```

Demo:

```text
수업명: AI와 피지컬 컴퓨팅
학생: 10명
차시: 5차시
```

그리고 일부 Progress/HelpRequest 상태를 자동 생성한다.

이 기능은 개발·시연 편의를 위한 것이며 실제 초기 설정 기능과 분리한다.

---

# PART 9. 프로젝트 구조

```text
classflow/

├── app/
│   ├── page.tsx
│   ├── setup/
│   │   └── page.tsx
│   ├── teacher/
│   │   └── page.tsx
│   └── student/
│       ├── page.tsx
│       └── [studentId]/
│           └── page.tsx
│
├── components/
│   ├── setup/
│   │   └── ClassSetupForm.tsx
│   ├── teacher/
│   │   ├── DashboardSummary.tsx
│   │   ├── ProgressGrid.tsx
│   │   ├── ProgressCell.tsx
│   │   ├── LessonHeader.tsx
│   │   ├── HelpQueue.tsx
│   │   └── StudentDetailPanel.tsx
│   └── student/
│       ├── StudentSelector.tsx
│       ├── LessonCard.tsx
│       └── LessonDetail.tsx
│
├── data/
│   └── demoData.ts
│
├── lib/
│   ├── storage.ts
│   ├── createClassData.ts
│   └── helpQueue.ts
│
├── types/
│   └── index.ts
│
└── README.md
```

---

# PART 10. Google Antigravity 개발 방식

Google Antigravity에서는 한 번에 전체 앱을 구현시키기보다 **작업 단위를 작게 나누고 각 단계가 끝날 때 브라우저에서 검증한 뒤 다음 단계로 넘어간다.**

권장 작업 흐름:

```text
PRD 문서 전달
 ↓
STEP 1 요청
 ↓
Antigravity가 코드 생성/수정
 ↓
브라우저 실행
 ↓
화면 확인
 ↓
문제 수정
 ↓
Git Commit
 ↓
STEP 2 요청
```

프로젝트 루트에 이 문서를 다음과 같이 저장할 수 있다.

```text
docs/classflow-mvp.md
```

그리고 Antigravity에:

```text
docs/classflow-mvp.md를 프로젝트 요구사항 문서로 사용하세요.
이번에는 STEP 1만 구현하세요.
다음 STEP을 임의로 구현하지 마세요.
```

라고 지시한다.

---

# PART 11. 개발 순서

## STEP 1
프로젝트 기본 구조 + Setup 화면

## STEP 2
동적 학생/차시 데이터 생성

## STEP 3
Teacher Dashboard Grid

## STEP 4
학생 선택 + Student Dashboard

## STEP 5
Lesson Detail

## STEP 6
Progress 상태 변경

## STEP 7
Understanding 변경

## STEP 8
localStorage

## STEP 9
Help Request

## STEP 10
Help Queue + 상태 전이

## STEP 11
Student Detail + Feedback

## STEP 12
차시 공개/비공개 + 수업 설정 수정

## STEP 13
데이터 초기화 + Demo Data

## STEP 14
반응형/Sticky Grid 개선

## STEP 15
기능 테스트 + 사용성 테스트

---

# PART 12. Google Antigravity용 STEP 1 구현 프롬프트

## 목적

이번 단계에서는 **Next.js 프로젝트 기본 구조와 범용 ClassFlow Setup 화면만 구현한다.**

Teacher Dashboard를 아직 구현하지 않는다.

---

## Antigravity Prompt

당신은 Next.js, TypeScript, Tailwind CSS에 능숙한 시니어 프론트엔드 개발자입니다.

이 프로젝트는 교사가 학생들의 학습 진행 상황과 도움 필요 여부를 한 화면에서 파악할 수 있도록 하는 교육용 웹앱 **ClassFlow**입니다.

프로젝트 요구사항은 `docs/classflow-mvp.md`를 기준으로 합니다.

현재는 **DB 없는 MVP 프로토타입 단계**입니다.

이번 STEP에서는 Supabase, Database, 인증, API, 서버 저장, Realtime을 절대 구현하지 마세요.

### 이번 STEP의 목표

다음만 구현하세요.

1. ClassFlow Home 화면
2. Class Setup 화면
3. Next.js 프로젝트 기본 폴더 구조
4. 필요한 TypeScript 기본 타입

다음 STEP의 Teacher Dashboard는 아직 구현하지 마세요.

### 기술 스택

- Next.js
- App Router
- TypeScript
- Tailwind CSS

불필요한 외부 라이브러리를 추가하지 마세요.

### Home

Route:

`/`

표시:

- ClassFlow
- “학생의 배움이 보이는 교실”
- “새 수업 만들기” 버튼

버튼 클릭 시:

`/setup`

으로 이동합니다.

### Setup

Route:

`/setup`

다음 값을 입력받습니다.

#### 수업명

text input

기본값:

`AI와 피지컬 컴퓨팅`

#### 학생 수

number input

기본값:

`20`

허용 범위:

`1 ~ 40`

#### 차시 수

number input

기본값:

`10`

허용 범위:

`1 ~ 30`

#### 수업 만들기 버튼

이번 STEP에서는 버튼 클릭 시 입력값을 검증하고 Console에 출력하는 정도까지만 구현하세요.

아직 localStorage 저장이나 Dashboard 이동을 구현하지 마세요.

### TypeScript 타입

`types/index.ts`

에 최소 다음 타입을 정의하세요.

- ClassSettings
- Student
- Lesson
- ProgressStatus
- Understanding
- Progress
- Submission
- HelpRequest
- Feedback
- ClassFlowData

타입은 `docs/classflow-mvp.md` 정의를 따르세요.

### 디자인

- 흰색 또는 매우 밝은 파스텔 배경
- 교육용 서비스 느낌
- 큰 제목과 명확한 입력 영역
- PC/태블릿 반응형
- 충분한 클릭 영역
- 한국어 UI

### 금지

이번 STEP에서는 다음을 구현하지 마세요.

- Teacher Dashboard
- Student Dashboard
- Progress Grid
- Supabase
- Database
- localStorage
- 로그인
- 인증
- RLS
- Realtime
- Help Queue

### 구현 완료 후

다음 내용을 보고하세요.

1. 생성/수정한 파일
2. 각 파일의 역할
3. 실행 방법
4. `/`에서 확인할 것
5. `/setup`에서 확인할 것
6. 다음 STEP에서 해야 할 일
7. 오류가 있다면 발생 원인

그리고 반드시 **STEP 1에서 멈추세요.**

---

# PART 13. STEP 1 완료 기준

다음이 정상 작동하면 완료이다.

- [ ] `/`에서 ClassFlow Home이 보인다.
- [ ] 새 수업 만들기 버튼이 보인다.
- [ ] 버튼 클릭 시 `/setup`으로 이동한다.
- [ ] 수업명 입력란이 보인다.
- [ ] 학생 수 입력란이 보인다.
- [ ] 차시 수 입력란이 보인다.
- [ ] 학생 수는 1~40만 허용된다.
- [ ] 차시 수는 1~30만 허용된다.
- [ ] 잘못된 값 입력 시 사용자에게 오류를 알려준다.
- [ ] PC에서 UI가 깨지지 않는다.
- [ ] 태블릿 크기에서도 UI가 깨지지 않는다.

---

# PART 14. 기능 테스트

최종 MVP 기능 테스트에서는 다음을 확인한다.

### 설정

- [ ] 학생 수를 5명으로 만들 수 있다.
- [ ] 학생 수를 30명으로 만들 수 있다.
- [ ] 차시 수를 3개로 만들 수 있다.
- [ ] 차시 수를 20개로 만들 수 있다.

### Dashboard

- [ ] 입력한 학생 수만큼 행이 생성된다.
- [ ] 입력한 차시 수만큼 열이 생성된다.
- [ ] 학생명 열이 가로 스크롤 시 고정된다.
- [ ] Header가 세로 스크롤 시 고정된다.
- [ ] 많은 학생에서도 스크롤이 가능하다.
- [ ] 많은 차시에서도 가로 스크롤이 가능하다.

### 상태

- [ ] 시작 전 → 진행 중 → 완료가 가능하다.
- [ ] 완료 → 진행 중으로 되돌릴 수 있다.
- [ ] 이해도를 변경할 수 있다.
- [ ] 도움 요청을 취소할 수 있다.
- [ ] 교사가 도움 완료 처리를 할 수 있다.
- [ ] 도움 완료 후 `understanding`은 자동으로 변경되지 않는다.

### Help Queue

- [ ] 직접 요청이 가장 먼저 나온다.
- [ ] need_help가 그 다음에 나온다.
- [ ] difficult가 그 다음에 나온다.
- [ ] 한 학생이 중복으로 표시되지 않는다.
- [ ] 같은 우선순위에서는 오래 기다린 학생부터 나온다.

### 저장

- [ ] 새로고침 후에도 데이터가 유지된다.
- [ ] 데이터 초기화가 가능하다.

---

# PART 15. 핵심 가설 사용성 테스트

기능이 정상 작동하는 것과 제품이 유용한 것은 다르다.

따라서 MVP 완성 후 반드시 다음 테스트를 수행한다.

## 테스트 A — 5초 인지 테스트

1. 도움 필요 학생 2~3명이 있는 Dashboard를 준비한다.
2. 교사에게 화면을 **5초 동안만** 보여준다.
3. 화면을 숨긴다.
4. 질문한다.

```text
도움이 필요한 학생은 누구였나요?
```

성공 기준:

- 테스트 참여자의 70% 이상이 1명 이상 정확하게 찾는다.
- 50% 이상이 가장 우선순위가 높은 학생을 맞힌다.

---

## 테스트 B — 실제 탐색 테스트

교사에게 Dashboard를 자유롭게 보여주고 질문한다.

```text
지금 가장 먼저 도와야 할 학생을 찾아주세요.
```

측정:

- 찾는 데 걸린 시간
- 클릭 횟수
- 잘못 선택한 횟수

목표:

```text
10초 이내
2회 이하 클릭
```

---

## 테스트 C — 만족도

질문:

```text
1. 학생 상태를 빠르게 파악하기 쉬웠나요?
2. Help Queue가 유용했나요?
3. Grid의 색상과 아이콘을 이해하기 쉬웠나요?
4. 실제 수업에서 사용하고 싶나요?
```

5점 척도로 측정한다.

목표:

```text
평균 4.0 이상
```

---

# PART 16. MVP 성공/실패 판단

## 성공

다음을 만족하면 다음 단계로 넘어간다.

- 실제 교사 또는 동료 교사 3명 이상 테스트
- 도움 학생 탐색 성공률 70% 이상
- 평균 탐색 시간 10초 이하
- 사용성 만족도 평균 4.0 이상
- 치명적인 UI 혼란이 없음

그 다음:

```text
Supabase
Auth
RLS
Realtime
```

도입을 검토한다.

---

## 부분 성공

사용자는 기능의 필요성에는 공감하지만 탐색이 느리거나 UI가 어려운 경우:

```text
DB 개발 시작 ❌
UI 수정 ✅
다시 테스트 ✅
```

---

## 실패

사용자들이 Help Queue/Grid의 필요성을 느끼지 못하거나 기존 방법보다 불편하다고 평가하면:

```text
Supabase 개발 보류
핵심 UX 재설계
```

한다.

---

# PART 17. 배포 시 최소 안전 조치

Vercel 등에 MVP를 배포할 경우 실제 개인정보를 저장하지 않는다.

### 반드시

- 가상 학생명 사용
- 실제 평가/성적 정보 사용 금지
- 테스트 완료 후 데이터 초기화

### 권장

검색엔진 색인을 막는다.

Next.js metadata 예:

```ts
robots: {
  index: false,
  follow: false,
}
```

또한 MVP URL을 공개 웹사이트에 게시하지 않고 테스트 참여자에게만 전달한다.

단, 이 방식은 인증이 아니다.

> URL을 아는 사람의 접근 자체를 막아야 하는 단계가 되면 실제 인증을 도입해야 한다.

---

# PART 18. MVP 이후

```text
DB 없는 MVP
      ↓
사용성 검증
      ↓
UI 수정
      ↓
핵심 가설 검증 성공
      ↓
Supabase 도입
      ↓
Teacher Auth
      ↓
Student Auth
      ↓
DB
      ↓
RLS
      ↓
Realtime
      ↓
실제 수업 Pilot
```

---

# PART 19. 개발 원칙

## 1.

**학생 수와 차시 수를 코드에 고정하지 않는다.**

## 2.

**한 STEP에서 다음 STEP 기능을 미리 구현하지 않는다.**

## 3.

**기능 구현 후 반드시 브라우저에서 확인한다.**

## 4.

**기능 테스트와 사용성 테스트를 구분한다.**

## 5.

**제품의 핵심 질문을 잊지 않는다.**

> 지금 누가 도움이 필요한가?

## 6.

**DB는 MVP의 가치가 검증된 후 도입한다.**

## 7.

**프로토타입에서는 실제 학생 개인정보를 사용하지 않는다.**

---

# 최종 개발 순서

```text
STEP 1
Home + Setup
      ↓
STEP 2
학생/차시 동적 생성
      ↓
STEP 3
Teacher Dashboard
      ↓
STEP 4
Student Dashboard
      ↓
STEP 5
Lesson
      ↓
STEP 6
Progress
      ↓
STEP 7
Understanding
      ↓
STEP 8
localStorage
      ↓
STEP 9
Help Request
      ↓
STEP 10
Help Queue
      ↓
STEP 11
Feedback
      ↓
STEP 12
Lesson 공개/비공개
      ↓
STEP 13
Reset / Demo
      ↓
STEP 14
Responsive / Sticky
      ↓
STEP 15
기능 테스트
      ↓
사용성 테스트
      ↓
MVP 검증
      ↓
Supabase 여부 결정
```
