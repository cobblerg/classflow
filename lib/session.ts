import type { RoleLabels } from "@/types";

/**
 * Firestore 강의 입장 세션 모델 (STEP 23)
 * - 다른 브라우저/기기에서 강의 코드로 입장했을 때 현재 세션의 최소 상태를 보관합니다.
 * - 인증(Authentication)이 아니며, 현재 탭 세션 유지를 위한 임시 식별 정보입니다.
 */
export interface JoinedCourseSession {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  studentCount: number;
  lessonCount: number;
  roleLabels: RoleLabels;
  participantId?: string;
  participantName?: string;
}

export const JOINED_COURSE_SESSION_KEY = "classflow-joined-course";

/**
 * 현재 브라우저 sessionStorage에서 입장 세션을 읽어옵니다.
 */
export function getJoinedCourseSession(): JoinedCourseSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(JOINED_COURSE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.courseId !== "string" || !parsed.courseId) {
      return null;
    }
    return parsed as JoinedCourseSession;
  } catch (error) {
    console.error("[ClassFlow Session] Failed to parse joined session:", error);
    return null;
  }
}

/**
 * 입장 세션을 sessionStorage에 저장합니다.
 */
export function setJoinedCourseSession(session: JoinedCourseSession): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      JOINED_COURSE_SESSION_KEY,
      JSON.stringify(session)
    );
  } catch (error) {
    console.error("[ClassFlow Session] Failed to save joined session:", error);
  }
}

/**
 * 선택된 수강생 ID와 이름을 세션에 갱신합니다.
 */
export function updateJoinedCourseParticipant(
  participantId: string,
  participantName?: string
): void {
  const current = getJoinedCourseSession();
  if (!current) return;

  setJoinedCourseSession({
    ...current,
    participantId,
    participantName: participantName || current.participantName,
  });
}

/**
 * 입장 세션을 삭제하고 초기화합니다.
 */
export function clearJoinedCourseSession(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(JOINED_COURSE_SESSION_KEY);
  } catch (error) {
    console.error("[ClassFlow Session] Failed to clear joined session:", error);
  }
}

/**
 * 현재 브라우저가 Firestore 온라인 입장 모드인지 판별합니다.
 */
export function isJoinedCourseMode(): boolean {
  return getJoinedCourseSession() !== null;
}
