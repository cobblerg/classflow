import type { ClassFlowData, ProgressStatus, Understanding } from "@/types";
import {
  saveClassFlowData,
  loadClassFlowData,
  clearClassFlowData,
} from "./storage";

// 모듈 스코프 메모리 저장소 (클라이언트 인메모리 캐시)
let inMemoryClassData: ClassFlowData | null = null;

/**
 * 생성된 수업 데이터를 메모리 저장소에 보관하고, 브라우저 localStorage에도 즉시 영속화하는 함수
 */
export function setCurrentClassData(data: ClassFlowData): void {
  inMemoryClassData = data;
  saveClassFlowData(data);
}

/**
 * 현재 수업 데이터를 조회하는 함수
 * 만약 새로고침 등으로 메모리가 비어 있다면, localStorage에서 우선 복원합니다.
 */
export function getCurrentClassData(): ClassFlowData | null {
  if (!inMemoryClassData) {
    const savedData = loadClassFlowData();
    if (savedData) {
      inMemoryClassData = savedData;
    }
  }
  return inMemoryClassData;
}

/**
 * 특정 학생과 차시의 진행 상태(ProgressStatus)를 업데이트하고 localStorage에 저장하는 함수
 * (시작 전: not_started, 진행 중: in_progress, 완료: completed)
 */
export function updateProgressStatus(
  studentId: string,
  lessonId: string,
  newStatus: ProgressStatus
): ClassFlowData | null {
  // 메모리 데이터가 없으면 먼저 스토리지에서 복원 시도
  const current = getCurrentClassData();
  if (!current) return null;

  const now = new Date().toISOString();
  let matched = false;

  // 기존 progress 목록을 순회하며 대상 학생-차시 상태 업데이트
  const updatedProgressList = current.progress.map((p) => {
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

  // 불변성을 지키며 데이터 갱신
  inMemoryClassData = {
    ...current,
    progress: updatedProgressList,
  };

  // localStorage에 최신 상태 즉시 저장
  saveClassFlowData(inMemoryClassData);

  return inMemoryClassData;
}

/**
 * 특정 학생과 차시의 이해도(Understanding)를 독립적으로 업데이트하고 localStorage에 저장하는 함수
 * (이해함: understood, 어려움: difficult, 도움 필요: need_help, 미선택: null)
 * ※ 주의: 기존 status는 절대 변경하지 않고 understanding과 updatedAt만 갱신합니다.
 */
export function updateUnderstanding(
  studentId: string,
  lessonId: string,
  newUnderstanding: Understanding
): ClassFlowData | null {
  const current = getCurrentClassData();
  if (!current) return null;

  const now = new Date().toISOString();
  let matched = false;

  // 기존 progress 목록을 순회하며 대상 학생-차시의 understanding만 업데이트
  const updatedProgressList = current.progress.map((p) => {
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
    ...current,
    progress: updatedProgressList,
  };

  // localStorage에 최신 상태 즉시 저장
  saveClassFlowData(inMemoryClassData);

  return inMemoryClassData;
}

/**
 * 메모리와 브라우저 localStorage의 모든 ClassFlow 데이터를 완전히 초기화하는 함수
 */
export function clearCurrentClassData(): void {
  inMemoryClassData = null;
  clearClassFlowData();
}
