"use client";

import type { Lesson, RoleLabels } from "@/types";
import { DEFAULT_ROLE_LABELS } from "@/lib/roleLabels";

interface LessonVisibilityManagerProps {
  lessons: Lesson[];
  onToggleLesson: (lessonId: string, currentPublished: boolean, title: string) => void;
  roleLabels?: RoleLabels;
}

// 교사/강사용 차시 공개/비공개 제어 및 상태 모니터링 패널 컴포넌트 (STEP 12, STEP 16 범용화)
export default function LessonVisibilityManager({
  lessons,
  onToggleLesson,
  roleLabels = DEFAULT_ROLE_LABELS,
}: LessonVisibilityManagerProps) {
  const publishedCount = lessons.filter((l) => l.published).length;
  const hiddenCount = lessons.length - publishedCount;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm mb-4">
      {/* 1. 패널 헤더 및 요약 배지 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎛️</span>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            차시 공개 관리
          </h3>
          <span className="text-xs text-slate-400 font-normal">
            (클릭하여 {roleLabels.participant} 공개 여부 변경)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            🔓 공개 {publishedCount}개
          </span>
          <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
            🔒 비공개 {hiddenCount}개
          </span>
        </div>
      </div>

      {/* 2. 차시별 토글 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {lessons.map((lesson) => {
          const isPublished = lesson.published;

          return (
            <div
              key={lesson.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                isPublished
                  ? "bg-emerald-50/40 border-emerald-200 hover:border-emerald-300"
                  : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-800">
                    {lesson.number}차시
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      isPublished
                        ? "text-emerald-800 bg-emerald-100/90"
                        : "text-slate-500 bg-slate-200"
                    }`}
                  >
                    {isPublished ? "공개" : "비공개"}
                  </span>
                </div>
                <p
                  className="text-xs text-slate-600 truncate font-medium"
                  title={lesson.title}
                >
                  {lesson.title}
                </p>
              </div>

              {/* 공개/비공개 토글 버튼 */}
              <button
                type="button"
                onClick={() =>
                  onToggleLesson(lesson.id, isPublished, `${lesson.number}차시 (${lesson.title})`)
                }
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] border ${
                  isPublished
                    ? "bg-white text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                }`}
              >
                {isPublished ? "🔒 비공개로 전환" : `🔓 ${roleLabels.participant}에게 공개`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        💡 차시를 비공개로 전환하더라도 기존 {roleLabels.participant}의 과제 진행도와 피드백 데이터는 안전하게 보존됩니다.
      </p>
    </div>
  );
}
