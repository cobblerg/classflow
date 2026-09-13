import type { ProgressStatus } from "@/types";

interface ProgressStatusSelectorProps {
  currentStatus: ProgressStatus;                   // 현재 선택된 진행 상태
  onStatusChange: (newStatus: ProgressStatus) => void; // 상태 변경 핸들러 함수
}

// 학생이 자신의 과제 진행 상태를 직접 변경할 수 있는 선택기 컴포넌트
export default function ProgressStatusSelector({
  currentStatus,
  onStatusChange,
}: ProgressStatusSelectorProps) {
  // 상태 옵션 정의 (시작 전, 진행 중, 완료)
  const options: {
    status: ProgressStatus;
    label: string;
    icon: string;
    description: string;
    activeBorder: string;
    activeBg: string;
    activeText: string;
  }[] = [
    {
      status: "not_started",
      label: "시작 전",
      icon: "⚪",
      description: "아직 시작하지 않았어요",
      activeBorder: "border-slate-400 ring-2 ring-slate-200",
      activeBg: "bg-slate-50",
      activeText: "text-slate-800",
    },
    {
      status: "in_progress",
      label: "진행 중",
      icon: "🟡",
      description: "열심히 수행하고 있어요",
      activeBorder: "border-amber-400 ring-2 ring-amber-200",
      activeBg: "bg-amber-50/60",
      activeText: "text-amber-900",
    },
    {
      status: "completed",
      label: "완료",
      icon: "🟢",
      description: "과제를 모두 마쳤어요",
      activeBorder: "border-emerald-500 ring-2 ring-emerald-200",
      activeBg: "bg-emerald-50/60",
      activeText: "text-emerald-900",
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = currentStatus === option.status;

          return (
            <button
              key={option.status}
              type="button"
              onClick={() => onStatusChange(option.status)}
              className={`relative flex flex-col items-center sm:items-start p-4 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? `${option.activeBorder} ${option.activeBg} shadow-xs`
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              {/* 상단: 상태 아이콘 및 라벨, 선택 체크마크 */}
              <div className="w-full flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl" role="img" aria-label={option.label}>
                    {option.icon}
                  </span>
                  <span className={`text-base font-bold ${isSelected ? option.activeText : "text-slate-700"}`}>
                    {option.label}
                  </span>
                </div>

                {/* 선택 여부를 나타내는 시각적 뱃지 (색상 외에 텍스트와 체크마크로도 구분) */}
                {isSelected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/90 border border-current shadow-2xs">
                    <span>✓</span> 선택됨
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-300 hidden sm:inline">
                    선택
                  </span>
                )}
              </div>

              {/* 하단: 상태 설명 */}
              <p className={`text-xs ${isSelected ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
