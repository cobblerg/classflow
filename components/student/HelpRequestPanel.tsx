"use client";

import { useState } from "react";
import type { HelpRequest } from "@/types";
import { createHelpRequest, cancelHelpRequest } from "@/lib/tempStore";

interface HelpRequestPanelProps {
  studentId: string;
  lessonId: string;
  currentHelpRequest: HelpRequest | null;
  onHelpRequestChange: () => void; // 상태 변경 시 부모 컴포넌트에 알리는 콜백
}

// 학생 차시 상세 화면의 도움 요청(Help Request) 패널 컴포넌트
export default function HelpRequestPanel({
  studentId,
  lessonId,
  currentHelpRequest,
  onHelpRequestChange,
}: HelpRequestPanelProps) {
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 현재 대기 중(waiting)인 요청이 있는지 확인
  const isWaiting = currentHelpRequest?.status === "waiting";

  // 1. 도움 요청 생성 핸들러
  const handleRequestHelp = (e: React.FormEvent) => {
    e.preventDefault();
    if (isWaiting || isSubmitting) return;

    setIsSubmitting(true);
    const created = createHelpRequest(studentId, lessonId, message);
    setIsSubmitting(false);

    if (created) {
      setMessage("");
      onHelpRequestChange();
    }
  };

  // 2. 대기 중인 도움 요청 취소 핸들러
  const handleCancel = () => {
    if (!currentHelpRequest || currentHelpRequest.status !== "waiting") return;

    const confirmed = window.confirm("도움 요청을 취소할까요?");
    if (confirmed) {
      const success = cancelHelpRequest(currentHelpRequest.id);
      if (success) {
        onHelpRequestChange();
      }
    }
  };

  // 요청 시각 포맷 변환 (예: 10:32 또는 오후 02:15)
  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-6">
      {/* 3. 대기 중(waiting) 상태 UI */}
      {isWaiting ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <span>🙋</span>
                <span>선생님께 도움 요청 중</span>
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              대기 중
            </span>
          </div>

          <p className="text-sm text-slate-600">
            선생님에게 도움을 요청했습니다. 곧 선생님이 확인하고 도와주실 거예요.
          </p>

          {/* 요청 상세 카드 */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm text-amber-950 flex flex-col gap-2">
            {currentHelpRequest.message && (
              <div>
                <span className="font-semibold text-amber-900 block mb-0.5">
                  요청 내용:
                </span>
                <p className="text-slate-800 bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                  {currentHelpRequest.message}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-amber-800/80 pt-1">
              <span>요청 시간: {formatTime(currentHelpRequest.requestedAt)}</span>
            </div>
          </div>

          {/* 요청 취소 버튼 */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-[0.98] transition-all"
            >
              ✕ 도움 요청 취소
            </button>
          </div>
        </div>
      ) : (
        /* 4. 새 도움 요청 작성 UI */
        <form onSubmit={handleRequestHelp} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-xl">🙋</span>
              <span>도움이 필요한가요?</span>
            </h2>
            <span className="text-xs text-slate-400">선생님께 직접 요청</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            혼자 해결하기 어렵다면 언제든지 선생님에게 도움을 요청하세요.
          </p>

          {/* 메시지 입력창 (선택 사항) */}
          <div>
            <label
              htmlFor="help-message"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              어떤 부분이 어려운가요? <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <input
              id="help-message"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="예: 버튼 입력값을 읽는 부분이 어려워요."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50/50"
            />
          </div>

          {/* 도움 요청하기 버튼 */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-[0.99] disabled:bg-amber-300 transition-all shadow-sm shadow-amber-500/20"
            >
              <span>🙋</span>
              <span>선생님께 도움 요청하기</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
