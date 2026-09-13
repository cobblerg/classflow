import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { HelpRequest, HelpRequestStatus } from "@/types";

/**
 * 도움 요청 생성 입력 인터페이스
 */
export interface CreateHelpRequestInput {
  courseId: string;
  participantId: string;
  lessonId: string;
  message?: string;
}

/**
 * Firestore Timestamp를 ISO 문자열로 안전하게 변환하는 헬퍼
 */
function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof (val as { toDate?: () => Date })?.toDate === "function") {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

/**
 * 특정 수강생의 특정 차시에 현재 '대기 중(waiting)'인 도움 요청을 조회하는 함수 (STEP 25)
 * - 경로: courses/{courseId}/helpRequests
 * - 조건: participantId == ..., lessonId == ..., status == "waiting"
 *
 * @returns 대기 중인 HelpRequest 문서가 있으면 HelpRequest 객체, 없으면 null
 */
export async function getActiveHelpRequest(
  courseId: string,
  participantId: string,
  lessonId: string
): Promise<HelpRequest | null> {
  if (!db) {
    throw new Error("Cloud Firestore가 초기화되지 않았습니다.");
  }
  if (!courseId || !participantId || !lessonId) {
    return null;
  }

  try {
    const helpRequestsColRef = collection(
      db,
      "courses",
      courseId,
      "helpRequests"
    );

    const q = query(
      helpRequestsColRef,
      where("participantId", "==", participantId),
      where("lessonId", "==", lessonId),
      where("status", "==", "waiting")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    // 대기 중 요청이 2개 이상 비정상적으로 발견될 경우 최신 1개 선택 및 경고 (요구사항 #28)
    if (snapshot.size > 1) {
      console.warn(
        `[ClassFlow Firestore] 수강생 ${participantId}, 차시 ${lessonId}에 중복된 waiting 요청 ${snapshot.size}건 발견. 최신 요청을 선택합니다.`
      );
    }

    // 가장 마지막/최신 문서 선택
    const docSnap = snapshot.docs[snapshot.docs.length - 1];
    const data = docSnap.data();

    return {
      id: docSnap.id,
      studentId: participantId,
      lessonId,
      message: typeof data.message === "string" ? data.message : "",
      status: (data.status as HelpRequestStatus) || "waiting",
      requestedAt: toIsoString(data.requestedAt),
      resolvedAt: data.resolvedAt ? toIsoString(data.resolvedAt) : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] getActiveHelpRequest error:",
      message
    );
    throw new Error(`활성 도움 요청 조회 실패: ${message}`);
  }
}

/**
 * 새 도움 요청을 Firestore에 생성하는 함수 (STEP 25)
 * - 동일 participant + lesson에 waiting 상태가 이미 존재하면 생성을 원천 차단합니다. (요구사항 #6, #11)
 * - 자동 Document ID 사용 (addDoc)
 * - 메시지는 trim() 및 최대 300자 제한 적용
 */
export async function createHelpRequest(
  input: CreateHelpRequestInput
): Promise<string> {
  if (!db) {
    throw new Error("Cloud Firestore가 초기화되지 않았습니다.");
  }
  const { courseId, participantId, lessonId, message = "" } = input;
  if (!courseId || !participantId || !lessonId) {
    throw new Error("courseId, participantId, lessonId가 모두 필요합니다.");
  }

  // 1. 현재 waiting 요청 존재 여부 확인 (중복 생성 방지, 요구사항 #6, #11)
  const existing = await getActiveHelpRequest(courseId, participantId, lessonId);
  if (existing) {
    throw new Error("이미 대기 중인 도움 요청이 있습니다.");
  }

  // 2. 메시지 정제 및 길이 제한 (요구사항 #12, #13)
  const trimmedMessage = message.trim().slice(0, 300);

  try {
    const helpRequestsColRef = collection(
      db,
      "courses",
      courseId,
      "helpRequests"
    );

    const docRef = await addDoc(helpRequestsColRef, {
      participantId,
      lessonId,
      message: trimmedMessage,
      status: "waiting",
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedAt: null,
      cancelledAt: null,
    });

    return docRef.id;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] createHelpRequest error:",
      errMsg
    );
    throw new Error(`도움 요청 생성 실패: ${errMsg}`);
  }
}

/**
 * 대기 중인 도움 요청을 수강생이 취소하는 함수 (STEP 25)
 * - 문서를 삭제하지 않고 status = "cancelled"로 업데이트합니다. (요구사항 #21, #22)
 */
export async function cancelHelpRequest(
  courseId: string,
  helpRequestId: string
): Promise<void> {
  if (!db) {
    throw new Error("Cloud Firestore가 초기화되지 않았습니다.");
  }
  if (!courseId || !helpRequestId) {
    throw new Error("courseId와 helpRequestId가 모두 필요합니다.");
  }

  try {
    const docRef = doc(db, "courses", courseId, "helpRequests", helpRequestId);
    await updateDoc(docRef, {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] cancelHelpRequest error:",
      message
    );
    throw new Error(`도움 요청 취소 실패: ${message}`);
  }
}

/**
 * 특정 수강생의 특정 차시 도움 요청 이력을 조회하는 헬퍼 함수 (STEP 25)
 */
export async function getParticipantLessonHelpRequests(
  courseId: string,
  participantId: string,
  lessonId: string
): Promise<HelpRequest[]> {
  if (!db) {
    throw new Error("Cloud Firestore가 초기화되지 않았습니다.");
  }
  if (!courseId || !participantId || !lessonId) {
    return [];
  }

  try {
    const helpRequestsColRef = collection(
      db,
      "courses",
      courseId,
      "helpRequests"
    );

    const q = query(
      helpRequestsColRef,
      where("participantId", "==", participantId),
      where("lessonId", "==", lessonId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }

    const list: HelpRequest[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        studentId: participantId,
        lessonId,
        message: typeof data.message === "string" ? data.message : "",
        status: (data.status as HelpRequestStatus) || "waiting",
        requestedAt: toIsoString(data.requestedAt),
        resolvedAt: data.resolvedAt ? toIsoString(data.resolvedAt) : undefined,
      };
    });

    // 요청 시각 내림차순(최신순) 정렬
    list.sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );

    return list;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] getParticipantLessonHelpRequests error:",
      message
    );
    throw new Error(`도움 요청 이력 조회 실패: ${message}`);
  }
}

/**
 * 특정 수강생의 현재 대기 중(waiting)인 모든 도움 요청을 단일 쿼리로 조회하는 함수 (STEP 25, Student Dashboard용)
 */
export async function getParticipantActiveHelpRequests(
  courseId: string,
  participantId: string
): Promise<HelpRequest[]> {
  if (!db || !courseId || !participantId) {
    return [];
  }

  try {
    const helpRequestsColRef = collection(
      db,
      "courses",
      courseId,
      "helpRequests"
    );

    const q = query(
      helpRequestsColRef,
      where("participantId", "==", participantId),
      where("status", "==", "waiting")
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        studentId: participantId,
        lessonId: typeof data.lessonId === "string" ? data.lessonId : "",
        message: typeof data.message === "string" ? data.message : "",
        status: (data.status as HelpRequestStatus) || "waiting",
        requestedAt: toIsoString(data.requestedAt),
        resolvedAt: data.resolvedAt ? toIsoString(data.resolvedAt) : undefined,
      };
    });
  } catch (error: unknown) {
    console.error(
      "[ClassFlow Firestore] getParticipantActiveHelpRequests error:",
      error
    );
    return [];
  }
}

