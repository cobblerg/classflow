import type { Metadata } from "next";
import LessonDetail from "@/components/student/LessonDetail";

// 메타데이터
export const metadata: Metadata = {
  title: "과제 상세 - ClassFlow",
  description: "차시별 학습 목표와 과제 내용을 확인하고 학습을 진행합니다.",
};

interface LessonDetailPageProps {
  params: Promise<{
    studentId: string;
    lessonId: string;
  }>;
}

// 학생 과제 상세 동적 페이지 (/student/[studentId]/lesson/[lessonId])
export default async function LessonDetailPage({
  params,
}: LessonDetailPageProps) {
  // Next.js 15+ 동적 파라미터 비동기 추출
  const { studentId, lessonId } = await params;

  return (
    <main className="flex-1 w-full p-4 sm:p-6 md:p-8 bg-slate-50 flex flex-col items-center justify-center">
      <LessonDetail studentId={studentId} lessonId={lessonId} />
    </main>
  );
}
