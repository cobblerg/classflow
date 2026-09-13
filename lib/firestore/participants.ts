import {
  collection,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student } from "@/types";

/**
 * 특정 강의의 수강생 목록(participants)을 Firestore에서 가져오는 헬퍼 함수 (STEP 23)
 * - 경로: courses/{courseId}/participants
 * - number ASC 기준으로 정렬하여 반환합니다. (요구사항 #13)
 * - Firestore 문서 ID를 student.id로 그대로 유지합니다. (요구사항 #16)
 * - 데이터가 불완전하더라도 앱이 다운되지 않도록 방어적으로 매핑합니다. (요구사항 #37)
 *
 * @param courseId Firestore 강의 ID
 * @returns number 순으로 정렬된 Student[] 배열
 */
export async function getCourseParticipants(
  courseId: string
): Promise<Student[]> {
  if (!db) {
    throw new Error(
      "Cloud Firestore가 초기화되지 않았습니다. .env.local 설정을 확인해 주세요."
    );
  }

  if (!courseId) {
    throw new Error("유효한 courseId가 전달되지 않았습니다.");
  }

  try {
    const participantsColRef = collection(
      db,
      "courses",
      courseId,
      "participants"
    );
    const snapshot = await getDocs(participantsColRef);

    if (snapshot.empty) {
      return [];
    }

    // 문서 데이터를 Student 인터페이스로 매핑
    const students: Student[] = snapshot.docs.map((docSnap, index) => {
      const data = docSnap.data();
      const studentNumber =
        typeof data.number === "number" ? data.number : index + 1;
      const defaultName = `수강생${String(studentNumber).padStart(2, "0")}`;

      return {
        id: docSnap.id,
        number: studentNumber,
        name: typeof data.name === "string" && data.name.trim() !== ""
          ? data.name
          : defaultName,
      };
    });

    // number 기준 오름차순(ASC) 정렬 보장 (요구사항 #13)
    students.sort((a, b) => a.number - b.number);

    return students;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] getCourseParticipants error:",
      message
    );
    throw new Error(`수강생 목록 조회 실패: ${message}`);
  }
}

/**
 * 수강생 명단을 Firestore 서브컬렉션에 일괄 저장하는 헬퍼 함수
 */
export async function saveParticipants(
  courseId: string,
  students: Student[]
): Promise<void> {
  if (!db) {
    throw new Error("Cloud Firestore가 초기화되지 않았습니다.");
  }

  try {
    const batch = writeBatch(db);
    for (const student of students) {
      const pRef = doc(db, "courses", courseId, "participants", student.id);
      batch.set(pRef, {
        number: student.number,
        name: student.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ClassFlow Firestore] saveParticipants error:", message);
    throw new Error(`수강생 명단 저장 실패: ${message}`);
  }
}
