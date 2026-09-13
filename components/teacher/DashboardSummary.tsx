import Link from "next/link";
import type { ClassSettings } from "@/types";

interface DashboardSummaryProps {
  settings: ClassSettings; // 수업 설정 정보
}

// 교사 대시보드 상단 헤더 및 기본 정보 요약 컴포넌트
export default function DashboardSummary({ settings }: DashboardSummaryProps) {
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
            교사용 대시보드
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 수업 설정으로 이동 버튼 */}
          <Link
            href="/setup"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all"
          >
            ⚙️ 수업 설정 변경
          </Link>
        </div>
      </div>

      {/* 2. 수업명 및 규모(학생 수, 차시 수) 표시 */}
      <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-slate-400 block mb-0.5">
            진행 중인 수업
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {settings.className}
          </h2>
        </div>

        {/* 학생 수 / 차시 수 요약 배지 */}
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">전체 학생</span>
            <strong className="text-slate-900 font-bold">{settings.studentCount}명</strong>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">전체 차시</span>
            <strong className="text-slate-900 font-bold">{settings.lessonCount}개</strong>
          </div>
        </div>
      </div>

      {/* 3. 셀 상태 안내 범례(Legend) */}
      <div className="mt-4 pt-3 border-t border-slate-100/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">상태 아이콘:</span>
        <span className="inline-flex items-center gap-1">
          <span>⚪</span> 시작 전
        </span>
        <span className="inline-flex items-center gap-1">
          <span>🟡</span> 진행 중
        </span>
        <span className="inline-flex items-center gap-1">
          <span>🟢</span> 완료
        </span>
        <span className="inline-flex items-center gap-1">
          <span>🔴</span> 도움 필요
        </span>
        <span className="inline-flex items-center gap-1">
          <span>🔒</span> 비공개 차시
        </span>
      </div>
    </header>
  );
}
