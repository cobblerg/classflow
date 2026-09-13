import type {
  ClassFlowData,
  ProgressStatus,
  Understanding,
  HelpRequest,
} from "@/types";
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
 * 특정 학생과 차시에 대한 현재 대기 중(waiting)인 도움 요청을 조회하는 헬퍼 함수
 */
export function getWaitingHelpRequest(
  studentId: string,
  lessonId: string
): HelpRequest | null {
  const current = getCurrentClassData();
  if (!current || !Array.isArray(current.helpRequests)) return null;

  return (
    current.helpRequests.find(
      (r) =>
        r.studentId === studentId &&
        r.lessonId === lessonId &&
        r.status === "waiting"
    ) || null
  );
}

/**
 * 학생의 도움 요청(HelpRequest)을 새로 생성하고 localStorage에 저장하는 함수 (STEP 9)
 * (중복 방지: 동일 학생 × 동일 차시에 이미 waiting 상태가 있다면 생성하지 않음)
 */
export function createHelpRequest(
  studentId: string,
  lessonId: string,
  message: string
): HelpRequest | null {
  const current = getCurrentClassData();
  if (!current) return null;

  // 1. 이미 동일 학생/차시에 대기 중인 요청이 있는지 중복 체크 (Test C)
  const existingWaiting = current.helpRequests.find(
    (r) =>
      r.studentId === studentId &&
      r.lessonId === lessonId &&
      r.status === "waiting"
  );
  if (existingWaiting) {
    console.warn("[HelpRequest] 이미 대기 중인 도움 요청이 존재합니다.");
    return null;
  }

  // 2. 충돌 위험 없는 고유 UUID 생성
  const newId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `help_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newRequest: HelpRequest = {
    id: newId,
    studentId,
    lessonId,
    message: message.trim() || "도움이 필요합니다.",
    status: "waiting",
    requestedAt: new Date().toISOString(),
  };

  // 3. 불변성을 유지하며 helpRequests 배열에 새 요청 추가
  inMemoryClassData = {
    ...current,
    helpRequests: [...current.helpRequests, newRequest],
  };

  // 4. localStorage에 즉시 영속화
  saveClassFlowData(inMemoryClassData);

  return newRequest;
}

/**
 * 학생이 자신의 대기 중(waiting)인 도움 요청을 취소하고 localStorage에 저장하는 함수 (STEP 9)
 * (완전 삭제가 아니라 status를 'cancelled'로 변경하여 이력 보존)
 */
export function cancelHelpRequest(helpRequestId: string): boolean {
  const current = getCurrentClassData();
  if (!current) return false;

  let updated = false;
  const updatedHelpRequests = current.helpRequests.map((r) => {
    if (r.id === helpRequestId && r.status === "waiting") {
      updated = true;
      return {
        ...r,
        status: "cancelled" as const,
      };
    }
    return r;
  });

  if (!updated) return false;

  inMemoryClassData = {
    ...current,
    helpRequests: updatedHelpRequests,
  };

  // localStorage에 취소 상태 즉시 영속화
  saveClassFlowData(inMemoryClassData);

  return true;
}

/**
 * 메모리와 브라우저 localStorage의 모든 ClassFlow 데이터를 완전히 초기화하는 함수
 */
export function clearCurrentClassData(): void {
  inMemoryClassData = null;
  clearClassFlowData();
}
