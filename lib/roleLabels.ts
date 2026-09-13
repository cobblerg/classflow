import type { ClassSettings, RoleLabels } from "@/types";

/**
 * 기본 역할 명칭 프리셋 상수 (일반 강의 / 특강)
 */
export const DEFAULT_ROLE_LABELS: RoleLabels = {
  instructor: "강사",
  participant: "수강생",
};

/**
 * 학교 수업 역할 명칭 프리셋 상수
 */
export const SCHOOL_ROLE_LABELS: RoleLabels = {
  instructor: "교사",
  participant: "학생",
};

/**
 * ClassSettings 객체로부터 안전하게 RoleLabels를 추출하는 함수
 * (roleLabels가 없거나 비어 있는 이전 버전 데이터에서도 안전하게 기본값 강사/수강생 적용)
 */
export function getRoleLabels(settings?: Partial<ClassSettings> | null): RoleLabels {
  return {
    instructor: settings?.roleLabels?.instructor?.trim() || DEFAULT_ROLE_LABELS.instructor,
    participant: settings?.roleLabels?.participant?.trim() || DEFAULT_ROLE_LABELS.participant,
  };
}

/**
 * 단어의 받침 유무에 따라 적절한 한글 조사를 반환하는 헬퍼 함수
 * 예: getJosa("수강생", "을/를") -> "수강생을"
 *     getJosa("교사", "을/를") -> "교사를"
 *     getJosa("학생", "이/가") -> "학생이"
 *     getJosa("강사", "이/가") -> "강사가"
 */
export function getJosa(word: string, pair: "을/를" | "이/가" | "은/는" | "과/와"): string {
  if (!word) return "";
  const lastChar = word.charCodeAt(word.length - 1);
  // 한글 유니코드 음절 범위 (가 ~ 힣)
  const isHangul = lastChar >= 0xac00 && lastChar <= 0xd7a3;
  if (!isHangul) {
    // 한글이 아닌 경우 기본 첫 번째 조사 반환
    return `${word}${pair.split("/")[0]}`;
  }

  const hasBatchim = (lastChar - 0xac00) % 28 !== 0;

  switch (pair) {
    case "을/를":
      return `${word}${hasBatchim ? "을" : "를"}`;
    case "이/가":
      return `${word}${hasBatchim ? "이" : "가"}`;
    case "은/는":
      return `${word}${hasBatchim ? "은" : "는"}`;
    case "과/와":
      return `${word}${hasBatchim ? "과" : "와"}`;
    default:
      return word;
  }
}
