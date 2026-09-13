// ClassFlow 데이터 모델 정의 (타입 정의)

// 0. 역할 명칭 설정 (강사/수강생, 교사/학생, 진행자/참여자 등, STEP 16)
export type RoleLabels = {
  instructor: string;   // 진행/지도자 명칭 (예: "강사", "교사", "진행자")
  participant: string;  // 학습/참여자 명칭 (예: "수강생", "학생", "참여자")
};

// 1. 수업/강의 기본 설정 정보
export type ClassSettings = {
  className: string;        // 강의/수업 이름
  studentCount: number;     // 수강생/학생 수
  lessonCount: number;      // 차시(수업 단위) 수
  createdAt: string;        // 생성 일시 (ISO 문자열)
  roleLabels?: RoleLabels;  // 화면 표시용 역할 명칭 설정 (미존재 시 기본값 강사/수강생)
  courseCode?: string;      // 수강생 접속용 6자리 강의 코드 (STEP 17, 데이터 생성/로드 시 자동 채워짐)
  courseId?: string;        // Firestore courses 컬렉션의 문서 ID (STEP 21, Firestore 연동 시 발급)
};

// 2. 학생 정보
export type Student = {
  id: string;             // 학생 고유 식별자(ID)
  number: number;         // 출석 번호
  name: string;           // 학생 이름
};

// 3. 차시(수업 내용) 정보
export type Lesson = {
  id: string;             // 차시 고유 식별자(ID)
  number: number;         // 차시 번호 (예: 1차시, 2차시)
  title: string;          // 차시 제목
  objective: string;      // 학습 목표
  description: string;    // 차시 설명 및 과제 내용
  published: boolean;     // 학생 공개 여부 (true: 공개, false: 비공개)
};

// 4. 과제 진행 상태 (시작 전, 진행 중, 완료)
export type ProgressStatus =
  | "not_started"         // 시작 전
  | "in_progress"         // 진행 중
  | "completed";          // 완료

// 5. 학생의 이해도 상태 (이해함, 어려움, 도움 필요, 미선택)
export type Understanding =
  | "understood"          // 😊 이해했어요
  | "difficult"           // 😐 조금 어려워요
  | "need_help"           // 🆘 도움이 필요해요
  | null;                 // 아직 선택하지 않음

// 6. 학생별 차시 진행 및 이해 상태
export type Progress = {
  studentId: string;      // 학생 ID
  lessonId: string;       // 차시 ID
  status: ProgressStatus; // 진행 상태
  understanding: Understanding; // 이해도
  updatedAt: string;      // 마지막 변경 일시
};

// 7. 학생 과제 제출 및 질문
export type Submission = {
  studentId: string;      // 학생 ID
  lessonId: string;       // 차시 ID
  content: string;        // 학생 결과물 내용
  question: string;       // 학생의 질문
  updatedAt: string;      // 저장 일시
};

// 7-1. 도움 요청 상태
export type HelpRequestStatus = "waiting" | "resolved" | "cancelled";

// 8. 도움 요청 정보
export type HelpRequest = {
  id: string;             // 도움 요청 식별자
  studentId: string;      // 학생 ID
  lessonId: string;       // 차시 ID
  message: string;        // 도움 요청 메시지 또는 질문
  status: HelpRequestStatus; // 상태 (대기 중, 교사 도움 완료, 학생 취소)
  requestedAt: string;    // 요청 시각
  resolvedAt?: string;    // 도움 완료 시각
};

// 9. 교사 피드백 정보
export type Feedback = {
  studentId: string;      // 학생 ID
  lessonId: string;       // 차시 ID
  content: string;        // 교사의 지도 및 피드백 내용
  updatedAt: string;      // 작성 일시
};

// 10. ClassFlow 전체 데이터 통합 구조 (상태 저장용)
export type ClassFlowData = {
  settings: ClassSettings;
  students: Student[];
  lessons: Lesson[];
  progress: Progress[];
  submissions: Submission[];
  helpRequests: HelpRequest[];
  feedback: Feedback[];
};
