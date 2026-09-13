import type {
  ClassSettings,
  ClassFlowData,
  Student,
  Lesson,
  Progress,
} from "@/types";

/**
 * 수업 설정 정보(ClassSettings)를 기반으로
 * 학생, 차시, 초기 Progress를 포함한 전체 ClassFlowData를 동적으로 생성하는 함수
 */
export function createClassData(settings: ClassSettings): ClassFlowData {
  // 현재 시각 (ISO 문자열 형태)
  const now = new Date().toISOString();

  // 1. 학생 목록 동적 생성 (1 ~ studentCount)
  // 예: 1 -> id: "student-01", number: 1, name: "학생01"
  const students: Student[] = [];
  for (let i = 1; i <= settings.studentCount; i++) {
    // 2자리 숫자로 맞추기 (예: 1 -> "01", 10 -> "10")
    const paddedNumber = String(i).padStart(2, "0");
    students.push({
      id: `student-${paddedNumber}`,
      number: i,
      name: `학생${paddedNumber}`,
    });
  }

  // 2. 차시 목록 동적 생성 (1 ~ lessonCount)
  // 1차시는 기본 공개(published: true), 나머지는 비공개(false)
  const lessons: Lesson[] = [];
  for (let i = 1; i <= settings.lessonCount; i++) {
    const paddedNumber = String(i).padStart(2, "0");
    lessons.push({
      id: `lesson-${paddedNumber}`,
      number: i,
      title: `${i}차시`,
      objective: "",
      description: "",
      published: i === 1, // 1차시만 기본으로 공개 처리
    });
  }

  // 3. 초기 Progress(진행 상태) 데이터 조합 생성
  // 학생 수 × 차시 수 만큼 모든 조합의 기본 Progress 객체 생성
  // 초기값: status = "not_started", understanding = null
  const progress: Progress[] = [];
  for (const student of students) {
    for (const lesson of lessons) {
      progress.push({
        studentId: student.id,
        lessonId: lesson.id,
        status: "not_started",
        understanding: null,
        updatedAt: now,
      });
    }
  }

  // 4. STEP 2 명세에 따라 과제 제출, 도움 요청, 피드백은 빈 배열로 초기화
  return {
    settings: {
      ...settings,
      createdAt: settings.createdAt || now,
    },
    students,
    lessons,
    progress,
    submissions: [],
    helpRequests: [],
    feedback: [],
  };
}
