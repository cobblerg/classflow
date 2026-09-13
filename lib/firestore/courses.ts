import {
  collection,
  addDoc,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RoleLabels } from "@/types";

/**
 * Firestore courses 컬렉션에 저장할 강의 생성 입력 인터페이스 (STEP 21)
 */
export interface CreateCourseInput {
  title: string;
  courseCode: string;
  roleLabels: RoleLabels;
  studentCount: number;
  lessonCount: number;
}

/**
 * Firestore courses 컬렉션에서 조회된 강의 문서 모델 (STEP 23)
 */
export interface CourseDocument {
  courseId: string;
  title: string;
  courseCode: string;
  roleLabels: RoleLabels;
  studentCount: number;
  lessonCount: number;
  instructorId: string | null;
  createdAt?: string | null;
}

/**
 * Cloud Firestore 'courses' 컬렉션에 새 강의 문서를 1개 저장하는 헬퍼 함수
 * - UI 컴포넌트와 Firestore 접근 계층을 명확히 분리합니다.
 * - 자동 생성된 Firestore Document ID (courseId)를 반환합니다.
 * - instructorId는 Authentication 구현 전이므로 null로 저장합니다.
 */
export async function createCourseDocument(
  input: CreateCourseInput
): Promise<string> {
  if (!db) {
    throw new Error(
      "Cloud Firestore가 초기화되지 않았습니다. .env.local 설정을 확인해 주세요."
    );
  }

  try {
    const coursesColRef = collection(db, "courses");
    const docRef = await addDoc(coursesColRef, {
      title: input.title,
      courseCode: input.courseCode,
      roleLabels: {
        instructor: input.roleLabels.instructor,
        participant: input.roleLabels.participant,
      },
      studentCount: input.studentCount,
      lessonCount: input.lessonCount,
      instructorId: null, // 인증 도입 전이므로 null 유지
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ClassFlow Firestore] createCourseDocument error:", message);
    throw new Error(`Firestore 강의 문서 저장 실패: ${message}`);
  }
}

/**
 * 강의 코드(courseCode)로 Firestore courses 컬렉션에서 강의를 단건 조회하는 헬퍼 함수 (STEP 23)
 * - where("courseCode", "==", normalizedCode) 조건으로 쿼리합니다.
 * - limit(2)를 적용하여 동일 코드 중복 존재 여부를 방어합니다. (요구사항 #3, #32)
 *
 * @param courseCode 정규화된 6자리 강의 코드
 * @returns 일치하는 강의가 있으면 CourseDocument, 없으면 null
 * @throws 2개 이상의 중복 문서가 발견되면 안전 에러 발생
 */
export async function findCourseByCode(
  courseCode: string
): Promise<CourseDocument | null> {
  if (!db) {
    throw new Error(
      "Cloud Firestore가 초기화되지 않았습니다. .env.local 설정을 확인해 주세요."
    );
  }

  try {
    const coursesColRef = collection(db, "courses");
    const q = query(coursesColRef, where("courseCode", "==", courseCode), limit(2));
    const snapshot = await getDocs(q);

    // 1. 검색 결과 없음
    if (snapshot.empty) {
      return null;
    }

    // 2. 중복 강의 코드 감지 (방어적 처리, 요구사항 #32)
    if (snapshot.size > 1) {
      console.error(
        `[ClassFlow Firestore] 중복된 강의 코드 발견 (${courseCode}): ${snapshot.size}개의 문서가 존재합니다.`
      );
      throw new Error(
        "동일한 강의 코드가 여러 개 발견되었습니다. 강사에게 새 강의 코드를 요청해 주세요."
      );
    }

    // 3. 단일 강의 정상 반환 (데이터 불완전 시 방어적 처리, 요구사항 #37)
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    const roleLabels: RoleLabels = {
      instructor: data.roleLabels?.instructor || "강사",
      participant: data.roleLabels?.participant || "수강생",
    };

    return {
      courseId: docSnap.id,
      title: typeof data.title === "string" ? data.title : "이름 없는 강의",
      courseCode: typeof data.courseCode === "string" ? data.courseCode : courseCode,
      roleLabels,
      studentCount: typeof data.studentCount === "number" ? data.studentCount : 0,
      lessonCount: typeof data.lessonCount === "number" ? data.lessonCount : 0,
      instructorId: data.instructorId || null,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ClassFlow Firestore] findCourseByCode error:", message);
    throw error;
  }
}
