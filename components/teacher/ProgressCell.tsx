import Link from "next/link";
import type { Progress } from "@/types";

interface ProgressCellProps {
  progress?: Progress;    // 학생과 차시에 해당하는 진행 상태 데이터
  isPublished: boolean;   // 해당 차시의 학생 공개 여부
  studentId: string;      // 학생 ID (STEP 11 상세 연결용)
  lessonId: string;       // 차시 ID (STEP 11 상세 연결용)
  studentName?: string;   // 접근성용 학생 이름
  lessonNumber?: number;  // 접근성용 차시 번호
}

// 개별 학생 × 차시의 진행 상태 및 이해도를 표시하는 Compact Cell 컴포넌트
export default function ProgressCell({
  progress,
  isPublished,
  studentId,
  lessonId,
  studentName = "학생",
  lessonNumber = 1,
}: ProgressCellProps) {
  const detailUrl = `/teacher/student/${studentId}/lesson/${lessonId}`;

  // 1. 차시가 비공개인 경우: 🔒 비공개 표시 (교사는 상세 보기 가능)
  if (!isPublished) {
    const label = `${studentName}, ${lessonNumber}차시: 비공개 차시 (클릭 시 상세 보기)`;
    return (
      <Link
        href={detailUrl}
        className="block w-full h-8 sm:h-8.5 flex items-center justify-center text-slate-400 bg-slate-100/60 hover:bg-slate-200/80 select-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-20"
        title={label}
        aria-label={label}
      >
        <span className="text-xs sm:text-sm" role="img" aria-hidden="true">🔒</span>
      </Link>
    );
  }

  // 2. 이해도가 도움 필요인 경우: 🔴 도움 필요 (진행 상태보다 최우선)
  if (progress?.understanding === "need_help") {
    const label = `${studentName}, ${lessonNumber}차시: 🔴 도움 필요 (클릭 시 상세 보기)`;
    return (
      <Link
        href={detailUrl}
        className="block w-full h-8 sm:h-8.5 flex items-center justify-center bg-red-100/80 hover:bg-red-200 transition-colors select-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:z-20"
        title={label}
        aria-label={label}
      >
        <span className="text-sm sm:text-base animate-pulse" role="img" aria-hidden="true">
          🔴
        </span>
      </Link>
    );
  }

  // 3. 진행 상태 기본 정보 계산
  const status = progress?.status || "not_started";
  const isDifficult = progress?.understanding === "difficult";

  let statusIcon = "⚪";
  let statusTitle = "시작 전";
  let bgClass = "hover:bg-blue-50/60";

  switch (status) {
    case "completed":
      statusIcon = "🟢";
      statusTitle = "과제 완료";
      bgClass = "bg-emerald-50/50 hover:bg-emerald-100/80";
      break;
    case "in_progress":
      statusIcon = "🟡";
      statusTitle = "과제 진행 중";
      bgClass = "bg-amber-50/50 hover:bg-amber-100/80";
      break;
    case "not_started":
    default:
      statusIcon = "⚪";
      statusTitle = "시작 전";
      bgClass = "hover:bg-slate-100/80";
      break;
  }

  // 이해도가 어려운 상태(difficult)인 경우 툴팁 및 aria-label에 반영
  const fullTitle = isDifficult
    ? `${studentName}, ${lessonNumber}차시: ${statusTitle} (🤔 어려워하고 있어요 - 클릭 시 상세 보기)`
    : `${studentName}, ${lessonNumber}차시: ${statusTitle} (클릭 시 상세 보기)`;

  return (
    <Link
      href={detailUrl}
      className={`relative block w-full h-8 sm:h-8.5 flex items-center justify-center select-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-20 ${bgClass}`}
      title={fullTitle}
      aria-label={fullTitle}
    >
      {/* 진행 상태 아이콘 */}
      <span className="text-sm sm:text-base" role="img" aria-hidden="true">
        {statusIcon}
      </span>

      {/* 3순위: 이해도가 '어려움(difficult)'일 때 교사가 인지할 수 있는 보조 뱃지 */}
      {isDifficult && (
        <span
          className="absolute -top-1 -right-1 text-[11px] leading-none bg-white rounded-full shadow-2xs p-0.5 border border-amber-200"
          title="어려움을 느끼고 있습니다"
          role="img"
          aria-hidden="true"
        >
          🤔
        </span>
      )}
    </Link>
  );
}
