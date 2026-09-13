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
  // Demo 모드: 비교 분석 및 테스트 편의를 위해 최소 처음 3개 차시(1~3차시)를 기본 공개로 설정
  const lessons: Lesson[] = [];
  for (let i = 1; i <= settings.lessonCount; i++) {
    const paddedNumber = String(i).padStart(2, "0");
    lessons.push({
      id: `lesson-${paddedNumber}`,
      number: i,
      title: `${i}차시`,
      objective: "",
      description: "",
      published: i <= 3, // 1~3차시는 공개, 4차시 이후는 비공개 (차시 수가 적어도 안전)
    });
  }

  // 3. 초기 Progress(진행 상태) 데이터 조합 생성
  // Dashboard 상태 표현 검증을 위해 현실적인 Demo 상태를 안전하게 부여
  const progress: Progress[] = [];
  for (const student of students) {
    for (const lesson of lessons) {
      // 기본값: 시작 전
      let status: "not_started" | "in_progress" | "completed" = "not_started";
      let understanding: "understood" | "difficult" | "need_help" | null = null;

      // 학생01: 1차시 완료, 2차시 완료, 3차시 진행 중
      if (student.number === 1) {
        if (lesson.number === 1) status = "completed";
        else if (lesson.number === 2) status = "completed";
        else if (lesson.number === 3) status = "in_progress";
      }
      // 학생02: 1차시 완료, 2차시 진행 중
      else if (student.number === 2) {
        if (lesson.number === 1) status = "completed";
        else if (lesson.number === 2) status = "in_progress";
      }
      // 학생03: 1차시 완료, 2차시 진행 중 + need_help (도움 필요)
      else if (student.number === 3) {
        if (lesson.number === 1) status = "completed";
        else if (lesson.number === 2) {
          status = "in_progress";
          understanding = "need_help";
        }
      }
      // 학생04: 1차시 진행 중
      else if (student.number === 4) {
        if (lesson.number === 1) status = "in_progress";
      }
      // 학생05: 1차시 완료
      else if (student.number === 5) {
        if (lesson.number === 1) status = "completed";
      }

      progress.push({
        studentId: student.id,
        lessonId: lesson.id,
        status,
        understanding,
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
