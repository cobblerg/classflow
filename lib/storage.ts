import type { ClassFlowData } from "@/types";

// 로컬 스토리지 키 상수 (프로젝트 전역에서 공통으로 사용)
export const STORAGE_KEY = "classflow-mvp-data";

/**
 * 브라우저 환경(Client-side)인지 안전하게 확인하는 헬퍼 함수
 * (Next.js SSR 과정에서 window 또는 localStorage is not defined 에러 방지)
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * ClassFlow 데이터를 브라우저의 localStorage에 저장하는 함수
 */
export function saveClassFlowData(data: ClassFlowData): void {
  if (!isBrowser()) return;

  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    // 용량 초과(QuotaExceeded) 또는 스토리지 접근 차단 등의 예외 안전하게 처리
    console.error("[Storage] ClassFlow 데이터 저장 중 오류가 발생했습니다:", error);
  }
}

/**
 * 브라우저의 localStorage에서 ClassFlow 데이터를 불러와 복원하는 함수
 */
export function loadClassFlowData(): ClassFlowData | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // 최소 스키마 검증: 필수 주요 필드가 갖추어져 있는지 확인
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.settings ||
      !Array.isArray(parsed.students) ||
      !Array.isArray(parsed.lessons) ||
      !Array.isArray(parsed.progress)
    ) {
      console.warn(
        "[Storage] 저장된 데이터가 올바른 ClassFlowData 형식이 아니므로 무시합니다."
      );
      return null;
    }

    // 향후 확장을 대비하여 빈 배열 필드가 누락되지 않도록 보정
    const validatedData: ClassFlowData = {
      settings: parsed.settings,
      students: parsed.students,
      lessons: parsed.lessons,
      progress: parsed.progress,
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      helpRequests: Array.isArray(parsed.helpRequests) ? parsed.helpRequests : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    };

    return validatedData;
  } catch (error) {
    // JSON 문법 오류 등 손상된 데이터 파싱 실패 시 초기 상태로 복구되도록 null 반환
    console.error("[Storage] ClassFlow 데이터 로딩 또는 파싱 중 오류가 발생했습니다:", error);
    return null;
  }
}

/**
 * localStorage에 저장된 ClassFlow 데이터를 완전히 삭제하는 함수
 */
export function clearClassFlowData(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[Storage] ClassFlow 데이터 삭제 중 오류가 발생했습니다:", error);
  }
}
