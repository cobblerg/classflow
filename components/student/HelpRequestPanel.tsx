"use client";

import { useState } from "react";
import type { HelpRequest, RoleLabels } from "@/types";
import { createHelpRequest as createLocalHelpRequest, cancelHelpRequest as cancelLocalHelpRequest } from "@/lib/tempStore";
import { DEFAULT_ROLE_LABELS } from "@/lib/roleLabels";

interface HelpRequestPanelProps {
  studentId: string;
  lessonId: string;
  currentHelpRequest: HelpRequest | null;
  onHelpRequestChange: () => void; // 상태 변경 시 부모 컴포넌트에 알리는 콜백
  roleLabels?: RoleLabels;
  isOnline?: boolean; // Firestore 온라인 모드 여부 (STEP 25)
  onRequestHelpOnline?: (message: string) => Promise<boolean>; // 온라인 모드 요청 생성 콜백
  onCancelHelpOnline?: () => Promise<boolean>; // 온라인 모드 요청 취소 콜백
}

// 학생 차시 상세 화면의 도움 요청(Help Request) 패널 컴포넌트
export default function HelpRequestPanel({
  studentId,
  lessonId,
  currentHelpRequest,
  onHelpRequestChange,
  roleLabels = DEFAULT_ROLE_LABELS,
  isOnline = false,
  onRequestHelpOnline,
  onCancelHelpOnline,
}: HelpRequestPanelProps) {
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 현재 대기 중(waiting)인 요청이 있는지 확인
  const isWaiting = currentHelpRequest?.status === "waiting";

  // 1. 도움 요청 생성 핸들러
  const handleRequestHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWaiting || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    // [A] Firestore 온라인 모드인 경우 (STEP 25)
    if (isOnline && onRequestHelpOnline) {
      try {
        const success = await onRequestHelpOnline(message);
        if (success) {
          setMessage("");
          onHelpRequestChange();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "도움 요청을 보내지 못했습니다.";
        setErrorMsg(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // [B] 기존 로컬 모드인 경우 (기존 모드 유지)
    const created = createLocalHelpRequest(studentId, lessonId, message);
    setIsSubmitting(false);

    if (created) {
      setMessage("");
      onHelpRequestChange();
    }
  };

  // 2. 대기 중인 도움 요청 취소 핸들러
  const handleCancel = async () => {
    if (!currentHelpRequest || currentHelpRequest.status !== "waiting" || isSubmitting) return;

    const confirmed = window.confirm("도움 요청을 취소할까요?");
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    // [A] Firestore 온라인 모드인 경우 (STEP 25)
    if (isOnline && onCancelHelpOnline) {
      try {
        const success = await onCancelHelpOnline();
        if (success) {
          onHelpRequestChange();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "도움 요청 취소에 실패했습니다.";
        setErrorMsg(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // [B] 기존 로컬 모드인 경우
    const success = cancelLocalHelpRequest(currentHelpRequest.id);
    setIsSubmitting(false);
    if (success) {
      onHelpRequestChange();
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
      {/* 오류 메시지 표시 */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5 animate-fadeIn"
        >
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

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
                <span>{roleLabels.instructor}에게 도움 요청 중</span>
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              대기 중
            </span>
          </div>

          <p className="text-sm text-slate-600">
            {roleLabels.instructor}에게 도움을 요청했습니다. 곧 {roleLabels.instructor}가 확인하고 도와주실 거예요.
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

          {/* 요청 취소 버튼 (요구사항 #21, #22) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "취소 처리 중..." : "✕ 도움 요청 취소"}
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
            <span className="text-xs text-slate-400">{roleLabels.instructor}에게 직접 요청</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            혼자 해결하기 어렵다면 언제든지 {roleLabels.instructor}에게 도움을 요청할 수 있어요.
          </p>

          {/* 메시지 입력창 (선택 사항, 최대 300자) */}
          <div>
            <label
              htmlFor="help-message"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              어떤 부분이 어려운가요? <span className="text-slate-400 font-normal">(선택, 최대 300자)</span>
            </label>
            <input
              id="help-message"
              type="text"
              value={message}
              maxLength={300}
              disabled={isSubmitting}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="예: 버튼 입력값을 읽는 부분이 어려워요."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50/50 disabled:opacity-50"
            />
          </div>

          {/* 도움 요청하기 버튼 (요구사항 #17, #18) */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-[0.99] disabled:bg-amber-300 transition-all shadow-sm shadow-amber-500/20 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>[도움 요청 보내는 중...]</span>
              ) : (
                <>
                  <span>🙋</span>
                  <span>{roleLabels.instructor}에게 도움 요청하기</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
