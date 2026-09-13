import {
  collection,
  addDoc,
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
 * Cloud Firestore 'courses' 컬렉션에 새 강의 문서를 1개 저장하는 헬퍼 함수
 * - UI 컴포넌트와 Firestore 접근 계층을 명확히 분리합니다. (요구사항 #5, #6)
 * - 자동 생성된 Firestore Document ID (courseId)를 반환합니다.
 * - instructorId는 Authentication 구현 전이므로 null로 저장합니다. (요구사항 #2)
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
      instructorId: null, // 인증 도입 전이므로 null 유지 (가짜 UID 생성 금지)
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
