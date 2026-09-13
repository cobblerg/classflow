import type { Progress } from "@/types";

interface ProgressCellProps {
  progress?: Progress;    // 학생과 차시에 해당하는 진행 상태 데이터
  isPublished: boolean;   // 해당 차시의 학생 공개 여부
}

// 개별 학생 × 차시의 진행 상태 및 이해도를 표시하는 Compact Cell 컴포넌트
export default function ProgressCell({ progress, isPublished }: ProgressCellProps) {
  // 1. 차시가 비공개인 경우: 🔒 비공개 표시
  if (!isPublished) {
    return (
      <div
        className="w-full h-9 sm:h-9.5 flex items-center justify-center text-slate-400 bg-slate-50/70 cursor-not-allowed select-none transition-colors"
        title="비공개된 차시입니다"
        aria-label="비공개 차시"
      >
        <span className="text-xs sm:text-sm">🔒</span>
      </div>
    );
  }

  // 2. 이해도가 도움 필요인 경우: 🔴 도움 필요 (진행 상태보다 최우선)
  if (progress?.understanding === "need_help") {
    return (
      <div
        className="w-full h-9 sm:h-9.5 flex items-center justify-center bg-red-50/70 hover:bg-red-100/80 transition-colors select-none"
        title="선생님의 도움이 필요한 상태입니다"
        aria-label="도움 필요"
      >
        <span className="text-sm sm:text-base animate-pulse" role="img" aria-label="도움 필요">
          🔴
        </span>
      </div>
    );
  }

  // 3. 진행 상태 기본 정보 계산
  const status = progress?.status || "not_started";
  const isDifficult = progress?.understanding === "difficult";

  let statusIcon = "⚪";
  let statusTitle = "시작 전";
  let bgClass = "hover:bg-slate-100/70";

  switch (status) {
    case "completed":
      statusIcon = "🟢";
      statusTitle = "과제 완료";
      bgClass = "bg-emerald-50/50 hover:bg-emerald-100/70";
      break;
    case "in_progress":
      statusIcon = "🟡";
      statusTitle = "과제 진행 중";
      bgClass = "bg-amber-50/50 hover:bg-amber-100/70";
      break;
    case "not_started":
    default:
      statusIcon = "⚪";
      statusTitle = "시작 전";
      bgClass = "hover:bg-slate-100/70";
      break;
  }

  // 이해도가 어려운 상태(difficult)인 경우 툴팁에 반영
  const fullTitle = isDifficult
    ? `${statusTitle} (🤔 어려워하고 있어요)`
    : statusTitle;

  return (
    <div
      className={`relative w-full h-9 sm:h-9.5 flex items-center justify-center select-none transition-colors ${bgClass}`}
      title={fullTitle}
      aria-label={fullTitle}
    >
      {/* 진행 상태 아이콘 */}
      <span className="text-sm sm:text-base" role="img" aria-label={statusTitle}>
        {statusIcon}
      </span>

      {/* 3순위: 이해도가 '어려움(difficult)'일 때 교사가 인지할 수 있는 보조 뱃지 */}
      {isDifficult && (
        <span
          className="absolute -top-1 -right-1 text-[11px] leading-none bg-white rounded-full shadow-2xs p-0.5 border border-amber-200"
          title="어려움을 느끼고 있습니다"
        >
          🤔
        </span>
      )}
    </div>
  );
}
