# ClassFlow Cloud Firestore 데이터 모델 설계서

이 문서는 ClassFlow를 여러 기기에서 실시간으로 함께 사용할 수 있도록 지원하기 위한 **Cloud Firestore 데이터 모델 설계 및 아키텍처 가이드**입니다.

---

## 1. Firestore 기본 개념 정리

Cloud Firestore는 유연하고 확장 가능한 NoSQL 클라우드 데이터베이스입니다. 전통적인 관계형 데이터베이스(RDB)의 테이블/행/열 개념 대신 다음과 같은 계층 구조를 사용합니다.

- **컬렉션 (Collection)**: 문서(Document)들의 컨테이너(폴더)입니다. 다른 컬렉션을 직접 포함할 수 없으며 오직 문서만 담습니다. (예: `courses`)
- **문서 (Document)**: 고유한 ID(키)를 가지며 키-값 쌍(Key-Value) 형태로 실제 데이터가 저장되는 단위입니다. (예: 특정 강의 문서 `K7P4XR_abc123`)
- **필드 (Field)**: 문서 내부에 저장되는 개별 데이터 속성입니다. (예: `title`, `courseCode`, `createdAt` 등)
- **서브컬렉션 (Subcollection)**: 특정 문서 아래에 종속된 하위 컬렉션입니다. 특정 문서와 강하게 결합된 데이터를 계층적으로 관리할 때 매우 유용합니다. (예: `courses/{courseId}/participants`)

---

## 2. ClassFlow 추천 데이터 구조

ClassFlow의 핵심 엔티티는 하나의 **강의(Course)**를 중심으로 수강생, 차시, 진행 상태, 도움 요청, 피드백이 유기적으로 연결됩니다. 따라서 최상위 `courses` 컬렉션 아래에 서브컬렉션을 배치하는 계층형 구조를 권장합니다.

```text
courses (Collection)
└── {courseId} (Document)
    ├── title: string
    ├── courseCode: string
    ├── instructorId: string | null
    ├── roleLabels: { instructor: string, participant: string }
    ├── studentCount: number
    ├── lessonCount: number
    ├── createdAt: Timestamp
    ├── updatedAt: Timestamp
    │
    ├── participants (Subcollection)
    │   └── {participantId}
    │
    ├── lessons (Subcollection)
    │   └── {lessonId}
    │
    ├── progress (Subcollection)
    │   └── {progressId}
    │
    ├── helpRequests (Subcollection)
    │   └── {helpRequestId}
    │
    ├── feedback (Subcollection)
    │   └── {feedbackId}
    │
    └── submissions (Subcollection)
        └── {submissionId}
```

---

## 3. 세부 문서 스키마 (Document Fields)

### 3.1. `courses/{courseId}` (강의 기본 문서)
- **Document ID**: Firestore 자동 생성 ID (Auto-ID) 권장
- **Fields**:
  ```typescript
  {
    title: string;                 // 강의명 (예: "AI와 피지컬 컴퓨팅")
    courseCode: string;            // 6자리 난수 강의 코드 (예: "K7P4XR")
    instructorId: string | null;   // 강사 식별자 (현재 STEP에서는 null)
    roleLabels: {                  // STEP 16에서 정의된 역할 명칭
      instructor: string;          // "교사" 또는 "강사"
      participant: string;         // "학생" 또는 "수강생"
    };
    studentCount: number;          // 총 수강생 수
    lessonCount: number;           // 총 차시 수
    createdAt: Timestamp;          // 생성 시각 (serverTimestamp)
    updatedAt: Timestamp;          // 최종 수정 시각 (serverTimestamp)
  }
  ```

### 3.2. `participants/{participantId}` (수강생 명단)
- **Document ID**: Firestore 자동 생성 ID 또는 고유 식별자
- **Fields**:
  ```typescript
  {
    number: number;                // 출석/배정 번호 (1, 2, ...)
    name: string;                  // 표시 이름 (예: "김민수", "수강생01")
    authUid: string | null;        // 향후 Firebase Auth 연동 시 UID (현재 null)
    createdAt: Timestamp;          // 등록 시각
  }
  ```

### 3.3. `lessons/{lessonId}` (차시 커리큘럼)
- **Document ID**: Firestore 자동 생성 ID
- **Fields**:
  ```typescript
  {
    number: number;                // 차시 순서 (1, 2, ...)
    title: string;                 // 차시 제목 (예: "기본 환경 설정")
    objective: string;             // 학습 목표
    description: string;           // 상세 설명
    published: boolean;            // 차시 공개 여부 (STEP 12 기능)
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  ```

### 3.4. `progress/{progressId}` (진행도 및 이해도 상태)
- **Document ID 전략**: 결정적 ID `${participantId}_${lessonId}` 권장 (하단 ID 전략 참조)
- **Fields**:
  ```typescript
  {
    participantId: string;         // 수강생 ID
    lessonId: string;              // 차시 ID
    status: "not_started" | "in_progress" | "completed"; // 진행 상태
    understanding: "good" | "so_so" | "need_help" | null; // 이해도
    updatedAt: Timestamp;
  }
  ```

### 3.5. `helpRequests/{helpRequestId}` (도움 요청 큐)
- **Document ID**: Firestore 자동 생성 ID (한 학생이 동일 차시에서 여러 번 요청/해결 이력을 남길 수 있으므로)
- **Fields**:
  ```typescript
  {
    participantId: string;
    lessonId: string;
    message: string;               // 요청 메시지
    status: "waiting" | "in_progress" | "resolved"; // 큐 상태
    requestedAt: Timestamp;        // 요청 시각
    resolvedAt: Timestamp | null;  // 해결 시각
  }
  ```

### 3.6. `feedback/{feedbackId}` (피드백)
- **Document ID**: 결정적 ID `${participantId}_${lessonId}` 권장 (수강생 1인당 차시별 1회 제출 원칙)
- **Fields**:
  ```typescript
  {
    participantId: string;
    lessonId: string;
    content: string;               // 작성된 피드백 내용
    updatedAt: Timestamp;
  }
  ```

### 3.7. `submissions/{submissionId}` (결과물 및 질문 제출)
- **Document ID**: Firestore 자동 생성 ID
- **Fields**:
  ```typescript
  {
    participantId: string;
    lessonId: string;
    content: string;
    question: string;
    updatedAt: Timestamp;
  }
  ```

---

## 4. 핵심 아키텍처 결정 사항 (Architecture Decisions)

### 4.1. Document ID 전략: 결정적 ID vs 자동 ID
| 엔티티 | 권장 방식 | 권장 ID 형식 | 선정 이유 |
| :--- | :--- | :--- | :--- |
| **Course** | 자동 ID | `auto-id` (예: `7xKs8d9...`) | 내부 식별자의 안정성 및 무작위성 확보 |
| **Participant** | 자동 ID | `auto-id` | 동명이인 처리 및 향후 인증 UID 매핑 용이 |
| **Progress** | **결정적 ID** | `${participantId}_${lessonId}` | 수강생 1명당 1개 차시에는 오직 1개의 상태만 존재하므로, 복잡한 검색 쿼리 없이 단일 `doc()` 참조로 $O(1)$ 즉시 업데이트 가능 |
| **Feedback** | **결정적 ID** | `${participantId}_${lessonId}` | 차시당 피드백 1회 작성 규칙이므로 덮어쓰기(Upsert)가 매우 간결해짐 |
| **HelpRequest** | 자동 ID | `auto-id` | 과거 요청 이력 보존 및 다중 요청 발생 가능성 수용 |

### 4.2. courseCode 중복 방지 및 빠른 조회 전략
Firestore는 관계형 데이터베이스의 `UNIQUE` 제약조건이 없습니다. 따라서 실시간 다중 기기 입장 시 `courseCode` 중복 방지와 빠른 조회를 위해 다음 전략을 고려할 수 있습니다.

- **전략 A (권장: 예약용 매핑 컬렉션 사용)**:
  - 최상위에 `courseCodes/{courseCode}` 문서를 생성하고 내부에 `{ courseId: "..." }` 필드만 저장.
  - 새 강의 생성 시 `courseCodes/{code}`가 이미 존재하는지 단일 읽기(또는 트랜잭션)로 확인하여 중복을 원천 차단.
  - 수강생이 `/join` 입장 시 복잡한 `where("courseCode", "==", code)` 컬렉션 전체 탐색 없이 `getDoc(doc(db, "courseCodes", code))`로 $O(1)$ 초고속 조회 가능.
- **전략 B (트랜잭션 쿼리 검사)**:
  - `where` 쿼리로 중복 여부 확인 후 생성 (동시 요청 시 충돌 가능성 존재).
- **전략 C (충분히 긴 무작위 코드 + 재시도)**:
  - 6자리 영숫자 조합($36^6 \approx 21$억 개)으로 충돌 확률이 낮으므로 실패 시 재시도.

> **결론**: 향후 STEP 22(실제 Firestore 기반 강의 입장)에서는 **전략 A (`courseCodes` 예약 매핑 컬렉션)**을 채택하여 속도와 고유성을 동시에 확보합니다.

### 4.3. Timestamp 전략 (서버 시각 vs ISO 문자열)
- **기존 localStorage**: JavaScript 클라이언트의 `new Date().toISOString()` 사용. (기기간 시간 동기화 오차 발생 가능)
- **Firestore**: `serverTimestamp()` 사용. (구글 클라우드 서버 시각을 기준으로 정확한 동기화 및 타임스탬프 일관성 보장)
- **변환 방식**: 향후 저장소 변환 계층(Repository Layer)에서 Firestore `Timestamp.toDate().toISOString()` 형태로 양방향 변환합니다.

---

## 5. 기존 localStorage 모델 ↔ Firestore 1:1 매핑표

| 기존 `localStorage` (TypeScript) | Firestore 추천 경로 | 설명 |
| :--- | :--- | :--- |
| `ClassSettings` | `courses/{courseId}` (문서 필드) | 강의명, 역할 라벨, 수강생 수, 차시 수 등 |
| `courseCode` | `courses/{courseId}.courseCode` & `courseCodes/{code}` | 6자리 입장 코드 |
| `Student[]` | `courses/{courseId}/participants/{participantId}` | 수강생 번호 및 이름 명단 |
| `Lesson[]` | `courses/{courseId}/lessons/{lessonId}` | 차시 목표, 설명, 공개 여부 |
| `Progress[]` | `courses/{courseId}/progress/{participantId}_{lessonId}` | 진행도 및 이해도 상태 |
| `HelpRequest[]` | `courses/{courseId}/helpRequests/{helpRequestId}` | 도움 요청 큐 목록 |
| `Feedback[]` | `courses/{courseId}/feedback/{participantId}_{lessonId}` | 차시별 회고/피드백 |
| `Submission[]` | `courses/{courseId}/submissions/{submissionId}` | 과제 제출 및 질문 |

---

## 6. 보안 규칙(Security Rules) 및 비용 주의사항

### 6.1. 보안 규칙 (현재 개발 단계 분석 및 한계 안내)
> [!WARNING]
> **Authentication 부재에 따른 보안 한계 안내**:
> - 현재 STEP 26은 **Firebase Authentication(사용자 로그인 및 토큰 인증)이 아직 구현되지 않은 단계**입니다.
> - 따라서 `localStorage`에 보관된 `courseId`는 브라우저 식별용일 뿐 실제 사용자 신원을 서버에서 증명하는 암호학적 서명이 아닙니다.
> - 현재 상태에서는 `courses/{courseId}` 및 하위 서브컬렉션(`participants`, `lessons`, `progress`, `helpRequests`)에 대한 읽기/쓰기 권한을 "강사"와 "수강생"으로 완벽히 분리하는 서버 측 보안 규칙을 적용할 수 없습니다.
> - **절대로 전체 DB에 `allow read, write: if true;`를 적용하지 마세요.**
> - 현재 개발 단계에서는 경로별 필요한 최소 권한(예: 특정 `courses/{courseId}` 하위 문서 읽기 및 `progress`, `helpRequests` 생성/상태 변경 허용)만 한정하여 테스트해야 하며, 실제 학생 개인정보나 민감 데이터는 절대 입력하지 마세요. (가명 테스트 데이터만 사용)
> - **완전한 강사 권한 보호 및 수강생 권한 격리는 향후 Firebase Authentication 도입 후 구현됩니다.**

### 6.2. 권장 임시 개발 보안 규칙 스키마 (STEP 26 기준)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 강의 메타데이터: 읽기 가능, 생성 가능
    match /courses/{courseId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if false; // 현재 단계 강사 설정 업데이트는 미구현

      // 수강생 및 차시 목록: 조회 가능, 생성은 배치 생성만
      match /participants/{participantId} {
        allow read: if true;
        allow write: if true; // 강의 생성 시 batch write
      }
      match /lessons/{lessonId} {
        allow read: if true;
        allow write: if true; // 강의 생성 시 batch write
      }

      // 진행도 및 이해도: 수강생 본인 상태 저장/조회 및 강사 실시간 onSnapshot
      match /progress/{progressId} {
        allow read, write: if true;
      }

      // 도움 요청: 수강생 생성/취소 및 강사 실시간 onSnapshot + status update(resolved)
      match /helpRequests/{helpRequestId} {
        allow read, create, update: if true;
        allow delete: if false; // 이력 데이터는 삭제하지 않음
      }
    }
  }
}
```

### 6.3. Firestore 비용 안내
- Firestore는 저장 용량뿐 아니라 **읽기(Read), 쓰기(Write), 삭제(Delete)** 횟수에 따라 과금됩니다.
- 무료 사용량(Spark 요금제): 하루 읽기 50,000회, 쓰기 20,000회 등 교육 및 MVP 검증에 충분한 무료 쿼터를 제공합니다.
- STEP 26에서는 셀 단위 N+1 리스너 대신 `progress` 컬렉션 전체에 리스너 1개, `helpRequests` 컬렉션 전체에 리스너 1개만 연결하여 읽기 비용을 극대화하여 절감했습니다.

---

## 7. 단계별 마이그레이션 현황 및 로드맵

- **STEP 20 (완료)**: Firestore 인스턴스 초기화, 데이터 모델 설계, 테스트 Course 문서 1개 저장/조회 확인
- **STEP 21 (완료)**: 강사 `/setup`에서 새 강의 개설 시 Firestore `courses/{courseId}` 문서 생성 연동
- **STEP 22 (완료)**: 강의 개설 시 `participants` 및 `lessons` 서브컬렉션 writeBatch 일괄 생성
- **STEP 23 (완료)**:
  - 수강생 `/join`에서 6자리 강의 코드로 Firestore `courses` 컬렉션 단건 쿼리(`where("courseCode", "==", code)`)
  - 강의 발견 시 기본 정보 확인 및 `sessionStorage` 기반 `JoinedCourseSession` 생성
  - 다른 기기/시크릿 창에서 `getCourseParticipants` 및 `getCourseLessons` 조회 후 수강생 선택 및 Student Dashboard 진입
- **STEP 24 (완료)**:
  - `courses/{courseId}/progress/{participantId}_{lessonId}` 서브컬렉션에 ProgressStatus 및 Understanding 저장/조회 구현
  - `setDoc`과 `createdAt`/`updatedAt` 분리 관리, `understanding: null` 취소 지원
  - 새로고침(F5) 및 Student Dashboard `getParticipantProgress`를 통한 차시별 상태 복원 완비
- **STEP 25 (완료)**:
  - 수강생 과제 상세(`LessonDetail`)에서 `courses/{courseId}/helpRequests`에 도움 요청 생성(자동 ID), 중복 대기 방지(`getActiveHelpRequest`), 취소(status: cancelled), 취소 후 재요청 구현
  - 새로고침(F5) 및 Student Dashboard `hasWaitingHelpRequest` 뱃지 실시간 동기화 완비
- **STEP 26 (완료)**:
  - 강사 Teacher Dashboard(`/teacher`) 및 Student Detail(`StudentDetailPanel`)의 Firestore 실시간 전환
  - `progress` 컬렉션 단일 `onSnapshot()` 리스너로 Progress Grid 실시간 반영 (새로고침 없이 ⚪ ➡️ 🟡 ➡️ 🟢, 🔴 도움 필요, 🤔 어려움 즉시 표시)
  - `helpRequests` 컬렉션 단일 `onSnapshot()` 리스너로 Help Queue 실시간 반영
  - Help Queue 중복 제거(dedup: waiting + need_help 1개 카드 병합) 및 우선순위 정렬(waiting 1순위 > need_help 2순위 > difficult 3순위, 동일 우선순위 오래된 순)
  - 강사 Help Queue [도움 완료] 액션 구현 (`resolveHelpRequest`: status = "resolved", resolvedAt)
  - 도움 완료 후 understanding = need_help는 변경하지 않고 독립성 유지 ("추가 확인 필요" 상태로 큐 유지)
  - 기존 로컬 Demo mode와 100% 무결성 유지 (settings.courseId 판별 분기)
- **STEP 27 (예정)**: 차시 공개/비공개(Lesson Visibility) 및 수강생 정보 Firestore 동기화

---

## 8. 현재 시스템 데이터 소스 (STEP 26 기준)

- **Course 기본정보**: Cloud Firestore (`courses/{courseId}`)
- **Participants 명단**: Cloud Firestore (`courses/{courseId}/participants`, number ASC)
- **Lessons 차시 목록**: Cloud Firestore (`courses/{courseId}/lessons`, number ASC)
- **Course Code 입장 (`/join`)**: Cloud Firestore 쿼리 (`where("courseCode", "==", code)`)
- **수강생 Progress 상태**: Cloud Firestore (`courses/{courseId}/progress/{participantId}_{lessonId}`)
- **수강생 Understanding 상태**: Cloud Firestore (`courses/{courseId}/progress/{participantId}_{lessonId}`)
- **수강생 HelpRequest 생성/취소/재요청**: Cloud Firestore (`courses/{courseId}/helpRequests`)
- **강사 Progress Grid 실시간 현황**: Cloud Firestore Realtime (`onSnapshot`, collection 전체 1개)
- **강사 Help Queue 실시간 대기열**: Cloud Firestore Realtime (`onSnapshot`, collection 전체 1개)
- **강사 HelpRequest Resolve(도움 완료)**: Cloud Firestore (`resolveHelpRequest`)
- **Demo / Local 수업**: `localStorage` (`classflow-mvp-data`)
- **피드백(Feedback)**: `localStorage` (Firestore 미전환)
- **과제 제출물(Submission)**: `localStorage` (Firestore 미전환)
- **차시 공개/비공개 설정 동기화**: 미구현 (강의 개설 시점의 Firestore published 값 조회 전용)
- **수강생 이름 수정 동기화**: 미구현 (강의 개설 시점의 Firestore name 값 조회 전용)
- **사용자 인증 (Firebase Authentication)**: 미구현 (향후 도입 예정)



