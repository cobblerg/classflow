import type {
  ClassFlowData,
  ProgressStatus,
  Understanding,
  HelpRequest,
  Feedback,
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

  // 이전 버전 데이터에서 roleLabels 누락 대비 (STEP 16)
  if (inMemoryClassData && !inMemoryClassData.settings.roleLabels) {
    inMemoryClassData.settings.roleLabels = {
      instructor: "강사",
      participant: "수강생",
    };
  }

  // 이전 버전 데이터에서 courseCode 누락 대비 (STEP 17)
  if (inMemoryClassData && !inMemoryClassData.settings.courseCode) {
    const { generateCourseCode } = require("./courseCode");
    inMemoryClassData.settings.courseCode = generateCourseCode();
    saveClassFlowData(inMemoryClassData);
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
 * 교사가 학생의 대기 중인 도움 요청을 완료(resolved) 처리하고 localStorage에 저장하는 함수 (STEP 10)
 * ※ 주의: 도움을 주었더라도 학생의 이해도 자가진단(understanding: need_help)은 절대 변경하지 않습니다.
 */
export function resolveHelpRequest(helpRequestId: string): boolean {
  const current = getCurrentClassData();
  if (!current) return false;

  const now = new Date().toISOString();
  let updated = false;

  const updatedHelpRequests = current.helpRequests.map((r) => {
    if (r.id === helpRequestId && r.status === "waiting") {
      updated = true;
      return {
        ...r,
        status: "resolved" as const,
        resolvedAt: now,
      };
    }
    return r;
  });

  if (!updated) return false;

  inMemoryClassData = {
    ...current,
    helpRequests: updatedHelpRequests,
  };

  // localStorage에 완료 상태 즉시 영속화
  saveClassFlowData(inMemoryClassData);

  return true;
}

/**
 * 특정 학생과 차시에 대한 교사 피드백(Feedback)을 조회하는 함수 (STEP 11)
 */
export function getFeedback(
  studentId: string,
  lessonId: string
): Feedback | null {
  const current = getCurrentClassData();
  if (!current || !Array.isArray(current.feedback)) return null;

  return (
    current.feedback.find(
      (f) => f.studentId === studentId && f.lessonId === lessonId
    ) || null
  );
}

/**
 * 교사가 특정 학생 × 차시에 피드백을 작성하거나 수정하여 저장하는 함수 (STEP 11)
 * (중복 방지: studentId + lessonId 기준으로 기존 피드백이 있으면 내용과 수정 시각만 갱신, 없으면 추가)
 * ※ 주의: Feedback 저장은 Progress, Understanding, HelpRequest에 일체 영향을 주지 않습니다.
 */
export function saveFeedback(
  studentId: string,
  lessonId: string,
  content: string
): Feedback | null {
  const current = getCurrentClassData();
  if (!current) return null;

  const trimmedContent = content.trim();
  if (!trimmedContent) return null;

  const now = new Date().toISOString();
  let matched = false;

  const currentFeedbackList = Array.isArray(current.feedback)
    ? current.feedback
    : [];

  // 기존 피드백이 있는지 검색하여 갱신
  const updatedFeedbackList = currentFeedbackList.map((f) => {
    if (f.studentId === studentId && f.lessonId === lessonId) {
      matched = true;
      return {
        ...f,
        content: trimmedContent,
        updatedAt: now,
      };
    }
    return f;
  });

  // 기존 피드백이 없었다면 새로 추가
  let savedFeedback: Feedback;
  if (!matched) {
    savedFeedback = {
      studentId,
      lessonId,
      content: trimmedContent,
      updatedAt: now,
    };
    updatedFeedbackList.push(savedFeedback);
  } else {
    savedFeedback = updatedFeedbackList.find(
      (f) => f.studentId === studentId && f.lessonId === lessonId
    )!;
  }

  inMemoryClassData = {
    ...current,
    feedback: updatedFeedbackList,
  };

  // localStorage에 즉시 영속화
  saveClassFlowData(inMemoryClassData);

  return savedFeedback;
}

/**
 * 특정 차시의 학생 공개 여부(published)를 토글(true ↔ false)하는 함수 (STEP 12)
 * ※ 주의: 비공개로 변경하더라도 학생의 Progress, HelpRequest, Feedback 데이터는 절대 삭제되지 않습니다.
 */
export function toggleLessonPublished(lessonId: string): boolean {
  const current = getCurrentClassData();
  if (!current) return false;

  let matched = false;
  const updatedLessons = current.lessons.map((lesson) => {
    if (lesson.id === lessonId) {
      matched = true;
      return {
        ...lesson,
        published: !lesson.published,
      };
    }
    return lesson;
  });

  if (!matched) return false;

  inMemoryClassData = {
    ...current,
    lessons: updatedLessons,
  };

  // localStorage에 변경 상태 즉시 영속화
  saveClassFlowData(inMemoryClassData);

  return true;
}

/**
 * 학급 기본 설정 중 학급명(className)을 수정하는 함수 (STEP 12)
 * (하위 호환성 유지)
 */
export function updateClassName(newClassName: string): boolean {
  return updateClassSettings(newClassName);
}

/**
 * 강의/학급 기본 설정 중 강의명(className) 및 역할 명칭(RoleLabels)을 수정하는 함수 (STEP 16)
 * (참여자 목록이나 차시, 진행 상태 등의 기존 데이터는 안전하게 보존됨)
 */
export function updateClassSettings(
  newClassName: string,
  newRoleLabels?: { instructor: string; participant: string }
): boolean {
  const current = getCurrentClassData();
  if (!current) return false;

  const trimmedName = newClassName.trim();
  if (!trimmedName) return false;

  const currentRoleLabels = current.settings.roleLabels || {
    instructor: "강사",
    participant: "수강생",
  };

  const updatedRoleLabels = newRoleLabels
    ? {
        instructor: newRoleLabels.instructor.trim() || currentRoleLabels.instructor,
        participant: newRoleLabels.participant.trim() || currentRoleLabels.participant,
      }
    : currentRoleLabels;

  inMemoryClassData = {
    ...current,
    settings: {
      ...current.settings,
      className: trimmedName,
      roleLabels: updatedRoleLabels,
    },
  };

  // localStorage에 변경 상태 즉시 영속화
  saveClassFlowData(inMemoryClassData);

  return true;
}

/**
 * 특정 수강생/참여자의 이름을 수정하고 localStorage에 저장하는 함수 (STEP 18)
 * - student.id 및 student.number는 절대 변경하지 않고 불변 유지 (요구사항 #25)
 * - Progress, Understanding, HelpRequest, Feedback 등 studentId 기반 데이터 100% 보존 (요구사항 #26)
 */
export function updateStudentName(studentId: string, newName: string): boolean {
  const current = getCurrentClassData();
  if (!current) return false;

  const trimmed = newName.trim();
  if (!trimmed || trimmed.length > 30) return false;

  const studentIndex = current.students.findIndex((s) => s.id === studentId);
  if (studentIndex === -1) return false;

  const updatedStudents = [...current.students];
  const target = updatedStudents[studentIndex];

  // id와 number는 그대로 유지하고 name만 갱신
  updatedStudents[studentIndex] = {
    ...target,
    name: trimmed,
  };

  inMemoryClassData = {
    ...current,
    students: updatedStudents,
  };

  // localStorage에 즉시 영속화
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
