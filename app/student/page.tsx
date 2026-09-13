import type { Metadata } from "next";
import StudentSelectView from "@/components/student/StudentSelectView";

// 학생 선택 페이지 메타데이터
export const metadata: Metadata = {
  title: "학생 선택 - ClassFlow",
  description: "테스트할 학생을 선택하여 학생용 대시보드로 이동합니다.",
};

// 학생 선택 페이지 라우트 (/student)
export default function StudentSelectPage() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 md:p-8 bg-slate-50 flex flex-col items-center">
      <StudentSelectView />
    </main>
  );
}
