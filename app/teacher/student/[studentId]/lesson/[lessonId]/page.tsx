import type { Metadata } from "next";
import StudentDetailPanel from "@/components/teacher/StudentDetailPanel";

// 메타데이터
export const metadata: Metadata = {
  title: "학생 상세 보기 - ClassFlow 교사용",
  description: "학생의 학습 진행도, 이해도, 도움 요청 이력을 확인하고 피드백을 전달합니다.",
};

interface TeacherStudentLessonPageProps {
  params: Promise<{
    studentId: string;
    lessonId: string;
  }>;
}

// 교사용 학생 상세 페이지 (/teacher/student/[studentId]/lesson/[lessonId])
export default async function TeacherStudentLessonPage({
  params,
}: TeacherStudentLessonPageProps) {
  // Next.js 15+ 동적 파라미터 비동기 추출
  const { studentId, lessonId } = await params;

  return (
    <main className="flex-1 w-full p-4 sm:p-6 md:p-8 bg-slate-50 flex flex-col items-center">
      <StudentDetailPanel studentId={studentId} lessonId={lessonId} />
    </main>
  );
}
