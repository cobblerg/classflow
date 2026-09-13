import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearCurrentClassData } from "@/lib/tempStore";
import { getRoleLabels } from "@/lib/roleLabels";
import type { ClassSettings } from "@/types";

interface DashboardSummaryProps {
  settings: ClassSettings; // 강의 설정 정보
}

// 교사/강사 대시보드 상단 헤더 및 기본 정보 요약 컴포넌트
export default function DashboardSummary({ settings }: DashboardSummaryProps) {
  const router = useRouter();
  const roleLabels = getRoleLabels(settings);

  // 테스트 데이터 전체 초기화 핸들러 (STEP 8)
  const handleReset = () => {
    const isConfirmed = window.confirm(
      "현재 ClassFlow 테스트 데이터를 모두 초기화하시겠습니까?\n\n이 작업은 되돌릴 수 없으며 저장된 모든 진행 상태가 삭제됩니다."
    );

    if (isConfirmed) {
      clearCurrentClassData();
      router.push("/setup");
    }
  };

  return (
    <header className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm mb-4">
      {/* 1. 상단 타이틀 및 액션 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-slate-900 hover:opacity-90 transition-opacity"
          >
            Class<span className="text-blue-600">Flow</span>
          </Link>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            {roleLabels.instructor} 대시보드
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 수강생/학생 화면 이동 버튼 */}
          <Link
            href="/student"
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 active:scale-[0.98] transition-all"
          >
            👥 {roleLabels.participant} 화면
          </Link>

          {/* 강의 설정으로 이동 버튼 */}
          <Link
            href="/setup"
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all"
          >
            ⚙️ 강의 설정
          </Link>

          {/* 데이터 초기화 버튼 (STEP 8) */}
          <button
            type="button"
            onClick={handleReset}
            title="ClassFlow 테스트 데이터를 완전히 초기화합니다"
            className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 active:scale-[0.98] transition-all"
          >
            🗑️ 데이터 초기화
          </button>
        </div>
      </div>

      {/* 2. 강의명 및 규모(수강생 수, 차시 수) 표시 (간소화 및 긴 강의명 줄바꿈 방어) */}
      <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-medium text-slate-400 block mb-0.5">
            진행 중인 강의
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-keep break-words">
            {settings.className}
          </h2>
        </div>

        {/* 수강생 수 / 차시 수 요약 배지 */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">{roleLabels.participant}</span>
            <strong className="text-slate-900 font-bold">{settings.studentCount}명</strong>
          </div>
          <span className="text-slate-300">•</span>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">차시</span>
            <strong className="text-slate-900 font-bold">{settings.lessonCount}개</strong>
          </div>
        </div>
      </div>
    </header>
  );
}
