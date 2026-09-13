import type { Metadata } from "next";
import StudentDashboard from "@/components/student/StudentDashboard";

// 학생 대시보드 페이지 메타데이터
export const metadata: Metadata = {
  title: "학생 대시보드 - ClassFlow",
  description: "학생 본인의 차시별 진행 상황을 확인하는 화면입니다.",
};

interface StudentDashboardPageProps {
  params: Promise<{
    studentId: string;
  }>;
}

// 학생별 대시보드 동적 페이지 (/student/[studentId])
export default async function StudentDashboardPage({
  params,
}: StudentDashboardPageProps) {
  // Next.js 15+ 동적 파라미터 비동기 해결
  const { studentId } = await params;

  return (
    <main className="flex-1 w-full p-4 sm:p-6 md:p-8 bg-slate-50 flex flex-col items-center justify-center">
      <StudentDashboard studentId={studentId} />
    </main>
  );
}
