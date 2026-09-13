import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firestore";

/**
 * 테스트 Course 데이터 인터페이스
 */
export interface TestCourseData {
  id?: string;
  title: string;
  courseCode: string;
  roleLabels: {
    instructor: string;
    participant: string;
  };
  studentCount: number;
  lessonCount: number;
  isTest: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/**
 * 개발 테스트용 Course 문서 생성 헬퍼 (요구사항 #22, #23, #24)
 * - Firestore 'courses' 컬렉션에 [TEST] 샘플 문서 1개를 저장합니다.
 * - 오직 개발 환경(development)에서만 동작합니다.
 */
export async function createTestCourse(): Promise<{
  success: boolean;
  documentId?: string;
  error?: string;
}> {
  if (process.env.NODE_ENV !== "development") {
    return {
      success: false,
      error: "createTestCourse는 오직 개발 환경(development)에서만 실행할 수 있습니다.",
    };
  }

  if (!db) {
    return {
      success: false,
      error: "Firestore 인스턴스가 초기화되지 않았습니다. .env.local 환경변수를 확인하세요.",
    };
  }

  try {
    const coursesColRef = collection(db, "courses");
    const newDocRef = await addDoc(coursesColRef, {
      title: "[TEST] ClassFlow Firestore",
      courseCode: "TEST20",
      roleLabels: {
        instructor: "강사",
        participant: "수강생",
      },
      studentCount: 3,
      lessonCount: 2,
      isTest: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      documentId: newDocRef.id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[ClassFlow Firestore Test] Error saving test course:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * 개발 테스트용 Course 문서 조회 헬퍼 (요구사항 #30)
 * - 생성된 테스트 Course 문서를 Firestore에서 다시 읽어와 검증합니다.
 */
export async function getTestCourse(courseId: string): Promise<{
  success: boolean;
  data?: TestCourseData;
  error?: string;
}> {
  if (process.env.NODE_ENV !== "development") {
    return {
      success: false,
      error: "getTestCourse는 오직 개발 환경(development)에서만 실행할 수 있습니다.",
    };
  }

  if (!db) {
    return {
      success: false,
      error: "Firestore 인스턴스가 초기화되지 않았습니다.",
    };
  }

  try {
    const docRef = doc(db, "courses", courseId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: `해당 ID(${courseId})의 문서를 찾을 수 없습니다.`,
      };
    }

    const data = docSnap.data() as TestCourseData;
    return {
      success: true,
      data: {
        ...data,
        id: docSnap.id,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[ClassFlow Firestore Test] Error reading test course:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
