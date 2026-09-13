import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student, Lesson } from "@/types";

/**
 * 강의 생성 시 수강생(participants)과 차시(lessons) 서브컬렉션을
 * Firestore writeBatch를 통해 일괄 저장하는 헬퍼 함수 (STEP 22)
 *
 * @param courseId 생성된 Firestore Course 문서 ID
 * @param students 수강생 목록 (Student.id를 Document ID로 사용)
 * @param lessons 차시 목록 (Lesson.id를 Document ID로 사용)
 */
export async function saveParticipantsAndLessons(
  courseId: string,
  students: Student[],
  lessons: Lesson[]
): Promise<void> {
  if (!db) {
    throw new Error(
      "Cloud Firestore가 초기화되지 않았습니다. .env.local 설정을 확인해 주세요."
    );
  }

  if (!courseId) {
    throw new Error("유효한 courseId가 전달되지 않았습니다.");
  }

  try {
    const batch = writeBatch(db);

    // 1. participants 서브컬렉션 문서 배치 추가
    // 경로: courses/{courseId}/participants/{participantId}
    // ID 전략: 기존 student.id(예: student-01)를 그대로 사용하여 localStorage와 일관성 유지 (요구사항 #4)
    for (const student of students) {
      const participantDocRef = doc(
        db,
        "courses",
        courseId,
        "participants",
        student.id
      );
      batch.set(participantDocRef, {
        number: student.number,
        name: student.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 2. lessons 서브컬렉션 문서 배치 추가
    // 경로: courses/{courseId}/lessons/{lessonId}
    // ID 전략: 기존 lesson.id(예: lesson-01)를 그대로 사용 (요구사항 #10)
    for (const lesson of lessons) {
      const lessonDocRef = doc(
        db,
        "courses",
        courseId,
        "lessons",
        lesson.id
      );
      batch.set(lessonDocRef, {
        number: lesson.number,
        title: lesson.title,
        objective: lesson.objective,
        description: lesson.description,
        published: lesson.published,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. 전체 배치 원자적 커밋 (수강생 최대 40 + 차시 최대 30 = 70개로 Firestore 500개 한도 내 안전)
    await batch.commit();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[ClassFlow Firestore] saveParticipantsAndLessons error:",
      message
    );
    throw new Error(`Firestore participants/lessons 저장 실패: ${message}`);
  }
}
