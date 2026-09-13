import type { Metadata } from "next";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";

// 페이지 메타데이터
export const metadata: Metadata = {
  title: "교사 대시보드 - ClassFlow",
  description: "학생들의 진행 상황과 도움 필요 여부를 한 화면에서 파악하는 Progress Grid 대시보드입니다.",
};

// 교사용 대시보드 페이지 (/teacher)
export default function TeacherPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 md:p-8 bg-slate-50 flex flex-col items-center">
      <TeacherDashboard />
    </main>
  );
}

