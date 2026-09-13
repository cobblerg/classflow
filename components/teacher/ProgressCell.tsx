import type { Progress } from "@/types";

interface ProgressCellProps {
  progress?: Progress;    // 학생과 차시에 해당하는 진행 상태 데이터
  isPublished: boolean;   // 해당 차시의 학생 공개 여부
}

// 개별 학생 × 차시의 진행 상태를 표시하는 Cell 컴포넌트
export default function ProgressCell({ progress, isPublished }: ProgressCellProps) {
  // 1. 차시가 비공개인 경우: 🔒 비공개 표시
  if (!isPublished) {
    return (
      <div
        className="w-full h-12 flex items-center justify-center text-slate-400 bg-slate-50/50 cursor-not-allowed select-none"
        title="비공개된 차시입니다"
        aria-label="비공개 차시"
      >
        <span className="text-base">🔒</span>
      </div>
    );
  }

  // 2. 이해도가 도움 필요인 경우: 🔴 도움 필요 (진행 상태보다 최우선)
  if (progress?.understanding === "need_help") {
    return (
      <div
        className="w-full h-12 flex items-center justify-center bg-red-50/60 hover:bg-red-100/70 transition-colors select-none"
        title="도움이 필요한 상태입니다"
        aria-label="도움 필요"
      >
        <span className="text-lg animate-pulse" role="img" aria-label="도움 필요">
          🔴
        </span>
      </div>
    );
  }

  // 3. 진행 상태에 따른 표시
  const status = progress?.status || "not_started";

  switch (status) {
    case "completed":
      // 🟢 완료 상태
      return (
        <div
          className="w-full h-12 flex items-center justify-center bg-emerald-50/40 hover:bg-emerald-100/60 transition-colors select-none"
          title="과제 완료"
          aria-label="완료"
        >
          <span className="text-lg" role="img" aria-label="완료">
            🟢
          </span>
        </div>
      );

    case "in_progress":
      // 🟡 진행 중 상태
      return (
        <div
          className="w-full h-12 flex items-center justify-center bg-amber-50/40 hover:bg-amber-100/60 transition-colors select-none"
          title="과제 진행 중"
          aria-label="진행 중"
        >
          <span className="text-lg" role="img" aria-label="진행 중">
            🟡
          </span>
        </div>
      );

    case "not_started":
    default:
      // ⚪ 시작 전 상태
      return (
        <div
          className="w-full h-12 flex items-center justify-center hover:bg-slate-100/60 transition-colors select-none"
          title="시작 전"
          aria-label="시작 전"
        >
          <span className="text-lg text-slate-300" role="img" aria-label="시작 전">
            ⚪
          </span>
        </div>
      );
  }
}
