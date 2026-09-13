import type { ClassFlowData, ProgressStatus } from "@/types";

// 모듈 스코프 메모리 저장소 (STEP 2 임시용, 새로고침 시 초기화됨)
let inMemoryClassData: ClassFlowData | null = null;

/**
 * 생성된 수업 데이터를 메모리 저장소에 저장하는 함수
 */
export function setCurrentClassData(data: ClassFlowData): void {
  inMemoryClassData = data;
}

/**
 * 현재 메모리에 보관된 수업 데이터를 조회하는 함수
 */
export function getCurrentClassData(): ClassFlowData | null {
  return inMemoryClassData;
}

/**
 * 특정 학생과 차시의 진행 상태(ProgressStatus)를 업데이트하는 함수
 * (시작 전: not_started, 진행 중: in_progress, 완료: completed)
 */
export function updateProgressStatus(
  studentId: string,
  lessonId: string,
  newStatus: ProgressStatus
): ClassFlowData | null {
  if (!inMemoryClassData) return null;

  const now = new Date().toISOString();
  let matched = false;

  // 기존 progress 목록을 순회하며 대상 학생-차시 상태 업데이트
  const updatedProgressList = inMemoryClassData.progress.map((p) => {
    if (p.studentId === studentId && p.lessonId === lessonId) {
      matched = true;
      return {
        ...p,
        status: newStatus,
        updatedAt: now,
      };
    }
    return p;
  });

  // 만약 매칭되는 progress 객체가 없었다면 새로 생성하여 추가
  if (!matched) {
    updatedProgressList.push({
      studentId,
      lessonId,
      status: newStatus,
      understanding: null,
      updatedAt: now,
    });
  }

  // 불변성(원본을 직접 수정하지 않고 새 객체로 교체하는 원칙)을 지키며 데이터 갱신
  inMemoryClassData = {
    ...inMemoryClassData,
    progress: updatedProgressList,
  };

  return inMemoryClassData;
}

/**
 * 특정 학생과 차시의 이해도(Understanding)를 독립적으로 업데이트하는 함수
 * (이해함: understood, 어려움: difficult, 도움 필요: need_help, 미선택: null)
 * ※ 주의: 기존 status는 절대 변경하지 않고 understanding과 updatedAt만 갱신합니다.
 */
export function updateUnderstanding(
  studentId: string,
  lessonId: string,
  newUnderstanding: import("@/types").Understanding
): ClassFlowData | null {
  if (!inMemoryClassData) return null;

  const now = new Date().toISOString();
  let matched = false;

  // 기존 progress 목록을 순회하며 대상 학생-차시의 understanding만 업데이트
  const updatedProgressList = inMemoryClassData.progress.map((p) => {
    if (p.studentId === studentId && p.lessonId === lessonId) {
      matched = true;
      return {
        ...p,
        understanding: newUnderstanding,
        updatedAt: now,
      };
    }
    return p;
  });

  // 매칭되는 progress 객체가 없는 예외 상황 대비
  if (!matched) {
    updatedProgressList.push({
      studentId,
      lessonId,
      status: "not_started",
      understanding: newUnderstanding,
      updatedAt: now,
    });
  }

  // 불변성을 지키며 데이터 갱신
  inMemoryClassData = {
    ...inMemoryClassData,
    progress: updatedProgressList,
  };

  return inMemoryClassData;
}


