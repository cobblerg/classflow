import Link from "next/link";
import type { Lesson, Progress } from "@/types";

interface LessonCardProps {
  lesson: Lesson;       // 차시 정보
  progress?: Progress;  // 해당 학생의 진행 상태 데이터
  studentId: string;    // 학생 ID (상세 경로 이동용)
}

// 학생 Dashboard의 개별 차시 카드 컴포넌트
export default function LessonCard({ lesson, progress, studentId }: LessonCardProps) {
  // 1. 상태 및 뱃지 스타일 계산 (우선순위: 비공개 -> 도움 필요 -> 완료 -> 진행 중 -> 시작 전)
  const getStatusInfo = () => {
    // 1순위: 비공개 차시
    if (!lesson.published) {
      return {
        icon: "🔒",
        label: "비공개",
        badgeStyle: "bg-slate-100 text-slate-400 border-slate-200",
        cardStyle: "bg-slate-50/70 border-slate-200/60 opacity-65 cursor-not-allowed",
        isLocked: true,
      };
    }

    // 2순위: 도움 필요 (진행 상태보다 최우선)
    if (progress?.understanding === "need_help") {
      return {
        icon: "🔴",
        label: "도움 필요",
        badgeStyle: "bg-red-50 text-red-700 border-red-200",
        cardStyle: "bg-white border-red-200 shadow-xs hover:border-red-400 hover:shadow-md",
        isLocked: false,
      };
    }

    // 3~5순위: 진행 상태별
    const status = progress?.status || "not_started";
    switch (status) {
      case "completed":
        return {
          icon: "🟢",
          label: "완료",
          badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
          cardStyle: "bg-white border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md",
          isLocked: false,
        };
      case "in_progress":
        return {
          icon: "🟡",
          label: "진행 중",
          badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
          cardStyle: "bg-white border-slate-200/80 shadow-xs hover:border-amber-400 hover:shadow-md",
          isLocked: false,
        };
      case "not_started":
      default:
        return {
          icon: "⚪",
          label: "시작 전",
          badgeStyle: "bg-slate-50 text-slate-600 border-slate-200",
          cardStyle: "bg-white border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md",
          isLocked: false,
        };
    }
  };

  const statusInfo = getStatusInfo();

  // 2. 비공개 차시 렌더링 (클릭 비활성화)
  if (statusInfo.isLocked) {
    return (
      <div
        className={`w-full rounded-2xl border p-4 sm:p-5 select-none transition-all ${statusInfo.cardStyle}`}
        aria-disabled="true"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl" role="img" aria-label="비공개">
              {statusInfo.icon}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-500">
                {lesson.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                아직 열리지 않은 수업입니다
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.badgeStyle}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. 공개 차시 렌더링 (클릭 시 Lesson Detail로 이동)
  return (
    <Link
      href={`/student/${studentId}/lesson/${lesson.id}`}
      className={`group block w-full rounded-2xl border p-4 sm:p-5 transition-all active:scale-[0.99] ${statusInfo.cardStyle}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* 좌측: 차시 정보 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl sm:text-2xl shrink-0" role="img" aria-label={statusInfo.label}>
            {statusInfo.icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {lesson.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {lesson.objective || "과제를 확인하고 학습을 진행하세요"}
            </p>
          </div>
        </div>

        {/* 우측: 상태 뱃지 및 학습하기 유도 버튼 */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.badgeStyle}`}
          >
            {statusInfo.label}
          </span>
          <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform hidden sm:inline-block">
            학습하기 →
          </span>
        </div>
      </div>
    </Link>
  );
}
