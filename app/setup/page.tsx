import type { Metadata } from "next";
import ClassSetupForm from "@/components/setup/ClassSetupForm";

// 수업 설정 페이지 메타데이터
export const metadata: Metadata = {
  title: "수업 설정 - ClassFlow",
  description: "수업명, 학생 수, 차시 수를 입력하여 새로운 수업 대시보드를 생성합니다.",
};

// 수업 설정 페이지 컴포넌트 (/setup)
export default function SetupPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12">
      <ClassSetupForm />
    </main>
  );
}
