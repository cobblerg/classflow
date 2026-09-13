import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Progress, ProgressStatus, Understanding } from "@/types";

/**
 * Progress 문서 ID를 결정적(deterministic)으로 생성하는 헬퍼 함수 (STEP 24)
 * 형식: {participantId}_{lessonId} (예: student-01_lesson-01)
 */
export function getProgressDocumentId(
  participantId: string,
  lessonId: string
): string {
  return `${participantId}_${lessonId}`;
}

/**
 * 특정 수강생의 특정 차시 Progress 문서를 Firestore에서 조회하는 함수
 * - 경로: courses/{courseId}/progress/{participantId}_{lessonId}
 * - 문서가 없으면 lazy creation 원칙에 따라 기본값(not_started, null)을 반환합니다. (요구사항 #10, #27)
 */
export async function getParticipantLessonProgress(
  courseId: string,
  participantId: string,
  lessonId: string
): Promise<Progress> {
  if (!db) {
    throw new Error("Cloud Firestore가 초기화되지 않았습니다.");
  }
  if (!courseId || !participantId || !lessonId) {
    throw new Error("courseId, participantId, lessonId가 모두 필요합니다.");
  }

  try {
    const docId = getProgressDocumentId(participantId, lessonId);
    const docRef = doc(db, "courses", courseId, "progress", docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // 최초 진입 시 문서가 없는 경우 기본값 반환 (요구사항 #10, #27)
      return {
        studentId: participantId,
        lessonId,
        status: "not_started",
        understanding: null,
        updatedAt: new Date().toISOString(),
      };
    }

    const data = docSnap.data();
    const status: ProgressStatus =
      data.status === "in_progress" || data.status === "completed"
        ? data.status
        : "not_started";

    const understanding: Understanding =
      data.understanding === "understood" ||
      data.understanding === "difficult" ||
      data.understanding === "need_help"
        ? data.understanding
        : null;

    let updatedAt = new Date().toISOString();
    if (data.updatedAt instanceof Timestamp) {
      updatedAt = data.updatedAt.toDate().toISOString();
    } else if (typeof data.updatedAt?.toDate === "function") {
      updatedAt = data.updatedAt.toDate().toISOString();
    }

    return {
      studentId: participantId,
      lessonId,
      status,
      understanding,
      updatedAt,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] getParticipantLessonProgress error:",
      message
    );
    throw new Error(`과제 진행 상태 조회 실패: ${message}`);
  }
}

/**
 * 특정 수강생의 모든 차시 Progress 목록을 한 번에 조회하는 함수 (STEP 24, Student Dashboard용)
 * - 경로: courses/{courseId}/progress
 * - 조건: where("participantId", "==", participantId) (N+1 쿼리 방지, 요구사항 #28)
 */
export async function getParticipantProgress(
  courseId: string,
  participantId: string
): Promise<Progress[]> {
  if (!db) {
    throw new Error("Cloud Firestore가 초기화되지 않았습니다.");
  }
  if (!courseId || !participantId) {
    return [];
  }

  try {
    const progressColRef = collection(db, "courses", courseId, "progress");
    const q = query(progressColRef, where("participantId", "==", participantId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const status: ProgressStatus =
        data.status === "in_progress" || data.status === "completed"
          ? data.status
          : "not_started";

      const understanding: Understanding =
        data.understanding === "understood" ||
        data.understanding === "difficult" ||
        data.understanding === "need_help"
          ? data.understanding
          : null;

      let updatedAt = new Date().toISOString();
      if (data.updatedAt instanceof Timestamp) {
        updatedAt = data.updatedAt.toDate().toISOString();
      } else if (typeof data.updatedAt?.toDate === "function") {
        updatedAt = data.updatedAt.toDate().toISOString();
      }

      return {
        studentId: participantId,
        lessonId: typeof data.lessonId === "string" ? data.lessonId : docSnap.id.split("_")[1] || "",
        status,
        understanding,
        updatedAt,
      };
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] getParticipantProgress error:",
      message
    );
    throw new Error(`수강생 진행 목록 조회 실패: ${message}`);
  }
}

/**
 * Progress 저장 입력 파라미터 인터페이스
 */
export interface SaveParticipantLessonProgressInput {
  courseId: string;
  participantId: string;
  lessonId: string;
  status?: ProgressStatus;
  understanding?: Understanding;
}

/**
 * 특정 수강생의 차시 진행 상태 및 이해도를 Firestore에 저장/업데이트하는 헬퍼 함수
 * - 최초 생성 시: createdAt, updatedAt 모두 serverTimestamp() (요구사항 #14, #15)
 * - 기존 문서 업데이트 시: createdAt은 불변 유지, updatedAt만 serverTimestamp() (요구사항 #14)
 * - status와 understanding은 상호 독립적으로 업데이트됩니다. (요구사항 #9)
 * - understanding: null 저장도 안전하게 반영됩니다. (요구사항 #21)
 */
export async function saveParticipantLessonProgress(
  input: SaveParticipantLessonProgressInput
): Promise<Progress> {
  if (!db) {
    throw new Error("Cloud Firestore가 초기화되지 않았습니다.");
  }
  const { courseId, participantId, lessonId, status, understanding } = input;
  if (!courseId || !participantId || !lessonId) {
    throw new Error("courseId, participantId, lessonId가 모두 필요합니다.");
  }

  try {
    const docId = getProgressDocumentId(participantId, lessonId);
    const docRef = doc(db, "courses", courseId, "progress", docId);

    // 1. 기존 문서 존재 여부 및 기존 필드값 확인
    const existingSnap = await getDoc(docRef);

    let finalStatus: ProgressStatus = "not_started";
    let finalUnderstanding: Understanding = null;

    if (!existingSnap.exists()) {
      // [최초 생성 (Lazy Creation)]
      finalStatus = status !== undefined ? status : "not_started";
      finalUnderstanding = understanding !== undefined ? understanding : null;

      await setDoc(docRef, {
        participantId,
        lessonId,
        status: finalStatus,
        understanding: finalUnderstanding,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // [기존 문서 업데이트]
      const existingData = existingSnap.data();
      finalStatus =
        status !== undefined
          ? status
          : existingData.status || "not_started";
      finalUnderstanding =
        understanding !== undefined
          ? understanding
          : existingData.understanding ?? null;

      const updatePayload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (status !== undefined) {
        updatePayload.status = status;
      }
      if (understanding !== undefined) {
        updatePayload.understanding = understanding;
      }

      await setDoc(docRef, updatePayload, { merge: true });
    }

    return {
      studentId: participantId,
      lessonId,
      status: finalStatus,
      understanding: finalUnderstanding,
      updatedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] saveParticipantLessonProgress error:",
      message
    );
    throw new Error(`진행 상태 저장 실패: ${message}`);
  }
}
