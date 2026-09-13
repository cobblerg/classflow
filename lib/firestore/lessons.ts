import {
  collection,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Lesson } from "@/types";

/**
 * 특정 강의의 차시 목록(lessons)을 Firestore에서 가져오는 헬퍼 함수 (STEP 23)
 * - 경로: courses/{courseId}/lessons
 * - number ASC 기준으로 정렬하여 반환합니다. (요구사항 #17)
 * - published 속성을 포함하여 Lesson 인터페이스로 매핑합니다. (요구사항 #18, #36)
 * - 데이터가 불완전하더라도 앱이 다운되지 않도록 방어적으로 매핑합니다. (요구사항 #37)
 *
 * @param courseId Firestore 강의 ID
 * @returns number 순으로 정렬된 Lesson[] 배열
 */
export async function getCourseLessons(
  courseId: string
): Promise<Lesson[]> {
  if (!db) {
    throw new Error(
      "Cloud Firestore가 초기화되지 않았습니다. .env.local 설정을 확인해 주세요."
    );
  }

  if (!courseId) {
    throw new Error("유효한 courseId가 전달되지 않았습니다.");
  }

  try {
    const lessonsColRef = collection(
      db,
      "courses",
      courseId,
      "lessons"
    );
    const snapshot = await getDocs(lessonsColRef);

    if (snapshot.empty) {
      return [];
    }

    // 문서 데이터를 Lesson 인터페이스로 매핑
    const lessons: Lesson[] = snapshot.docs.map((docSnap, index) => {
      const data = docSnap.data();
      const lessonNumber =
        typeof data.number === "number" ? data.number : index + 1;

      return {
        id: docSnap.id,
        number: lessonNumber,
        title:
          typeof data.title === "string" && data.title.trim() !== ""
            ? data.title
            : `${lessonNumber}차시`,
        objective: typeof data.objective === "string" ? data.objective : "",
        description:
          typeof data.description === "string" ? data.description : "",
        published:
          typeof data.published === "boolean" ? data.published : true,
      };
    });

    // number 기준 오름차순(ASC) 정렬 보장 (요구사항 #17)
    lessons.sort((a, b) => a.number - b.number);

    return lessons;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] getCourseLessons error:",
      message
    );
    throw new Error(`차시 목록 조회 실패: ${message}`);
  }
}

/**
 * 차시 목록을 Firestore 서브컬렉션에 일괄 저장하는 헬퍼 함수
 */
export async function saveLessons(
  courseId: string,
  lessons: Lesson[]
): Promise<void> {
  if (!db) {
    throw new Error("Cloud Firestore가 초기화되지 않았습니다.");
  }

  try {
    const batch = writeBatch(db);
    for (const lesson of lessons) {
      const lRef = doc(db, "courses", courseId, "lessons", lesson.id);
      batch.set(lRef, {
        number: lesson.number,
        title: lesson.title,
        objective: lesson.objective,
        description: lesson.description,
        published: lesson.published,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ClassFlow Firestore] saveLessons error:", message);
    throw new Error(`차시 목록 저장 실패: ${message}`);
  }
}
