"use client";

import { useState, useEffect } from "react";
import type { Feedback, RoleLabels } from "@/types";
import { saveFeedback } from "@/lib/tempStore";
import { getJosa } from "@/lib/roleLabels";

interface FeedbackEditorProps {
  studentId: string;
  lessonId: string;
  existingFeedback: Feedback | null;
  onFeedbackSaved: () => void;
  roleLabels?: RoleLabels;
}

// 교사/강사가 참여자에게 전달할 피드백을 작성하고 수정하는 에디터 컴포넌트 (STEP 11, STEP 16 범용화)
export default function FeedbackEditor({
  studentId,
  lessonId,
  existingFeedback,
  onFeedbackSaved,
  roleLabels = { instructor: "강사", participant: "수강생" },
}: FeedbackEditorProps) {
  const [content, setContent] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 기존 피드백이 변경되거나 최초 로드될 때 textarea 내용 초기화
  useEffect(() => {
    if (existingFeedback) {
      setContent(existingFeedback.content);
    } else {
      setContent("");
    }
    setErrorMsg(null);
  }, [existingFeedback]);

  // 피드백 저장 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMsg("피드백 내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    const saved = saveFeedback(studentId, lessonId, trimmed);
    setIsSubmitting(false);

    if (saved) {
      setErrorMsg(null);
      setSuccessMsg("피드백이 안전하게 저장되었습니다.");
      onFeedbackSaved();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);
    }
  };

  // 피드백 저장 시각 포맷 변환
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-6">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="text-xl">💬</span>
          <span>{roleLabels.instructor} 피드백</span>
        </h2>
        {existingFeedback && (
          <span className="text-xs text-slate-400">
            마지막 수정: {formatDateTime(existingFeedback.updatedAt)}
          </span>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
        {getJosa(roleLabels.participant, "이/가")} 학습을 진행하며 참고할 수 있도록 격려나 지도 조언을 남겨주세요. {roleLabels.participant} 화면에 실시간으로 표시됩니다.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="예: 버튼 입력값을 다시 확인하고 조건문 블록을 연결해 보세요! 잘하고 있어요."
            rows={4}
            className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-slate-50/50 resize-y leading-relaxed"
          />

          {errorMsg && (
            <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
              <span>⚠</span>
              <span>{errorMsg}</span>
            </p>
          )}
        </div>

        {/* 저장 성공 토스트 알림 */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-fadeIn">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-300 transition-all shadow-sm shadow-blue-500/20"
          >
            {existingFeedback ? "피드백 수정하기" : "피드백 저장하기"}
          </button>
        </div>
      </form>
    </section>
  );
}
