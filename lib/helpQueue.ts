import type { ClassFlowData, Understanding } from "@/types";

// 교사 대시보드 도움 요청 대기열(Help Queue) 개별 항목 인터페이스
export type HelpQueueItemType = {
  id: string; // studentId_lessonId 고유 키
  studentId: string;
  lessonId: string;
  studentName: string;
  studentNumber: number;
  lessonNumber: number;
  lessonTitle: string;
  hasWaitingRequest: boolean; // waiting 상태의 직접 도움 요청 유무
  understanding: "need_help" | "difficult" | null; // 학생의 이해도 자가진단 상태
  message?: string; // 학생이 작성한 도움 요청 메시지
  priority: number; // 1: 직접 도움 요청, 2: 도움 필요, 3: 어려움
  timestamp: string; // 정렬 기준 시각 (ISO 문자열)
  helpRequestId?: string; // 도움 완료 처리에 필요한 waiting HelpRequest ID
};

/**
 * 상대적인 대기 시간을 사람이 읽기 쉬운 형식으로 변환하는 헬퍼 함수
 * (예: "방금 전", "3분 전", "15분 전", "1시간 전")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const now = new Date().getTime();
    const past = new Date(isoString).getTime();
    const diffSeconds = Math.floor((now - past) / 1000);

    if (diffSeconds < 60) {
      return "방금 전";
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}시간 전`;
    }

    const date = new Date(isoString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * 전체 ClassFlow 데이터에서 도움이 필요한 학생들을 집계, 중복 제거 및 우선순위 정렬하여 반환하는 함수 (STEP 10)
 *
 * [우선순위 규칙]
 * 1순위: 🙋 waiting HelpRequest (직접 요청)
 * 2순위: 🆘 understanding === "need_help" (도움 필요)
 * 3순위: 🤔 understanding === "difficult" (어려움)
 *
 * [정렬 규칙]
 * 같은 우선순위 내에서는 가장 오래 대기한 학생 먼저 (oldest first, timestamp ASC)
 *
 * [중복 제거]
 * studentId + lessonId 단위로 단일 Queue Item으로 병합
 */
export function buildHelpQueue(data: ClassFlowData): HelpQueueItemType[] {
  if (!data) return [];

  const { students, lessons, progress, helpRequests } = data;

  // 1. 학생 및 차시 빠른 조회를 위한 Map 생성
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const lessonMap = new Map(lessons.map((l) => [l.id, l]));

  // 2. 학생Id + 차시Id를 키로 사용하는 중복 제거 맵
  const queueMap = new Map<string, HelpQueueItemType>();

  // 3. 직접 도움 요청 (waiting 상태) 확인
  // 비공개 차시는 제외 (요구사항 26번 권장 준수: published === true인 차시만 대상)
  helpRequests
    .filter((req) => {
      if (req.status !== "waiting") return false;
      const lesson = lessonMap.get(req.lessonId);
      return lesson && lesson.published;
    })
    .forEach((req) => {
      const student = studentMap.get(req.studentId);
      const lesson = lessonMap.get(req.lessonId);
      if (!student || !lesson) return;

      const key = `${req.studentId}_${req.lessonId}`;

      queueMap.set(key, {
        id: key,
        studentId: req.studentId,
        lessonId: req.lessonId,
        studentName: student.name,
        studentNumber: student.number,
        lessonNumber: lesson.number,
        lessonTitle: lesson.title,
        hasWaitingRequest: true,
        understanding: null, // 아래 4단계에서 progress의 understanding과 병합됨
        message: req.message,
        priority: 1, // 1순위: 직접 요청
        timestamp: req.requestedAt,
        helpRequestId: req.id,
      });
    });

  // 4. 학생 진행/이해도(Progress)에서 need_help 및 difficult 확인
  progress
    .filter((p) => {
      if (p.understanding !== "need_help" && p.understanding !== "difficult") {
        return false;
      }
      const lesson = lessonMap.get(p.lessonId);
      return lesson && lesson.published;
    })
    .forEach((p) => {
      const student = studentMap.get(p.studentId);
      const lesson = lessonMap.get(p.lessonId);
      if (!student || !lesson) return;

      const key = `${p.studentId}_${p.lessonId}`;
      const existing = queueMap.get(key);

      if (existing) {
        // 이미 3단계에서 waiting 직접 도움 요청이 등록된 경우:
        // 중복 생성하지 않고 understanding 정보만 병합 (priority는 1순위 유지)
        existing.understanding = p.understanding as "need_help" | "difficult";
      } else {
        // waiting 요청이 없는 경우 신규 Queue Item 등록
        const isNeedHelp = p.understanding === "need_help";
        queueMap.set(key, {
          id: key,
          studentId: p.studentId,
          lessonId: p.lessonId,
          studentName: student.name,
          studentNumber: student.number,
          lessonNumber: lesson.number,
          lessonTitle: lesson.title,
          hasWaitingRequest: false,
          understanding: p.understanding as "need_help" | "difficult",
          priority: isNeedHelp ? 2 : 3, // 2순위: need_help, 3순위: difficult
          timestamp: p.updatedAt,
        });
      }
    });

  // 5. 우선순위 및 시간순 정렬
  const queueList = Array.from(queueMap.values());

  queueList.sort((a, b) => {
    // 1차 정렬: priority ASC (1순위 -> 2순위 -> 3순위)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // 2차 정렬: 같은 우선순위 내에서는 가장 오래 대기한 학생 먼저 (oldest first, timestamp ASC)
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  return queueList;
}
