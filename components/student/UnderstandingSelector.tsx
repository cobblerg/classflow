import type { Understanding } from "@/types";

interface UnderstandingSelectorProps {
  currentUnderstanding: Understanding;                   // 현재 선택된 이해도 상태
  onUnderstandingChange: (newUnderstanding: Understanding) => void; // 이해도 변경 핸들러
  disabled?: boolean;                                    // 저장 중 등 비활성화 여부 (요구사항 #24)
}

// 학생이 자신의 학습 이해도(이해함 / 어려움 / 도움 필요)를 선택하는 컴포넌트
export default function UnderstandingSelector({
  currentUnderstanding,
  onUnderstandingChange,
  disabled = false,
}: UnderstandingSelectorProps) {
  // 이해도 옵션 정의
  const options: {
    value: "understood" | "difficult" | "need_help";
    label: string;
    icon: string;
    description: string;
    activeBorder: string;
    activeBg: string;
    activeText: string;
  }[] = [
    {
      value: "understood",
      label: "이해했어요",
      icon: "😊",
      description: "내용을 잘 파악했어요",
      activeBorder: "border-emerald-500 ring-2 ring-emerald-200",
      activeBg: "bg-emerald-50/60",
      activeText: "text-emerald-900",
    },
    {
      value: "difficult",
      label: "어려워요",
      icon: "🤔",
      description: "조금 헷갈리거나 어려워요",
      activeBorder: "border-amber-500 ring-2 ring-amber-200",
      activeBg: "bg-amber-50/60",
      activeText: "text-amber-900",
    },
    {
      value: "need_help",
      label: "도움이 필요해요",
      icon: "🆘",
      description: "선생님의 도움이 필요해요",
      activeBorder: "border-red-500 ring-2 ring-red-200",
      activeBg: "bg-red-50/60",
      activeText: "text-red-900",
    },
  ];

  // 클릭 시 토글 처리 (이미 선택된 것을 다시 누르면 null로 취소)
  const handleClick = (val: "understood" | "difficult" | "need_help") => {
    if (disabled) return;
    if (currentUnderstanding === val) {
      onUnderstandingChange(null);
    } else {
      onUnderstandingChange(val);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = currentUnderstanding === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(option.value)}
              className={`relative flex flex-col items-center sm:items-start p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              } ${
                isSelected
                  ? `${option.activeBorder} ${option.activeBg} shadow-xs`
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              {/* 상단: 아이콘, 라벨, 선택 뱃지 */}
              <div className="w-full flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl" role="img" aria-label={option.label}>
                    {option.icon}
                  </span>
                  <span className={`text-base font-bold ${isSelected ? option.activeText : "text-slate-700"}`}>
                    {option.label}
                  </span>
                </div>

                {/* 선택 시각화 뱃지 (체크마크 포함) */}
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

      {/* 선택된 상태가 있을 경우 간편한 선택 취소 버튼 제공 */}
      {currentUnderstanding !== null && (
        <div className="mt-2.5 text-right">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUnderstandingChange(null)}
            className={`text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors ${
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            선택 취소 (선택 해제하기)
          </button>
        </div>
      )}
    </div>
  );
}
