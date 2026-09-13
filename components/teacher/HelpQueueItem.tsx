"use client";

import Link from "next/link";
import type { HelpQueueItemType } from "@/lib/helpQueue";
import { formatRelativeTime } from "@/lib/helpQueue";

interface HelpQueueItemProps {
  item: HelpQueueItemType;
  onResolve: (helpRequestId: string) => void;
}

// 교사 대시보드 도움 요청 대기열의 개별 학생 카드 컴포넌트 (STEP 10)
export default function HelpQueueItem({ item, onResolve }: HelpQueueItemProps) {
  // 도움 완료 클릭 핸들러
  const handleResolveClick = () => {
    if (!item.helpRequestId) return;
    onResolve(item.helpRequestId);
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        item.priority === 1
          ? "bg-amber-50/40 border-amber-200/80 shadow-2xs hover:border-amber-300"
          : item.priority === 2
          ? "bg-rose-50/30 border-rose-200/70 shadow-2xs hover:border-rose-300"
          : "bg-indigo-50/20 border-slate-200/80 shadow-2xs hover:border-slate-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* 좌측: 학생 정보 및 차시, 배지, 메시지 */}
        <div className="flex-1 min-w-0">
          {/* 상단: 학생 번호/이름, 차시, 시간 */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-sm font-bold text-slate-900">
              {item.studentName}
            </span>
            <span className="text-xs text-slate-400">
              ({item.studentNumber}번)
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              {item.lessonNumber}차시
            </span>
            <span className="text-xs text-slate-500 truncate max-w-[200px]" title={item.lessonTitle}>
              {item.lessonTitle}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-400">
              {formatRelativeTime(item.timestamp)}
            </span>
          </div>

          {/* 상태 배지 영역 (중복 제거 후 단일 카드에 복합 표시) */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {/* 1. 직접 도움 요청 배지 */}
            {item.hasWaitingRequest && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                <span>🙋</span> 직접 도움 요청
              </span>
            )}

            {/* 2. 도움 필요 배지 */}
            {item.understanding === "need_help" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                <span>🆘</span> 도움 필요
                {!item.hasWaitingRequest && (
                  <span className="text-[10px] font-normal text-rose-600">
                    (자가진단)
                  </span>
                )}
              </span>
            )}

            {/* 3. 어려움 배지 */}
            {item.understanding === "difficult" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span>🤔</span> 어려움
              </span>
            )}
          </div>

          {/* 요청 메시지 (있는 경우) */}
          {item.message && (
            <div className="text-xs text-slate-700 bg-white/90 p-2.5 rounded-xl border border-slate-200/70 inline-block max-w-full">
              <span className="font-semibold text-slate-900 mr-1">요청 내용:</span>
              <span>&ldquo;{item.message}&rdquo;</span>
            </div>
          )}
        </div>

        {/* 우측: 액션 버튼 ([학생 보기], [도움 완료]) */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* 학생 상세 화면 이동 버튼 */}
          <Link
            href={`/student/${item.studentId}/lesson/${item.lessonId}`}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 active:scale-[0.98] transition-all shadow-2xs"
            title="해당 학생의 과제 상세 화면으로 이동합니다"
          >
            학생 보기 →
          </Link>

          {/* 도움 완료 버튼: 직접 도움 요청(waiting)이 있는 경우에만 표시 (요구사항 14, 18번 준수) */}
          {item.hasWaitingRequest && item.helpRequestId && (
            <button
              type="button"
              onClick={handleResolveClick}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-2xs shadow-emerald-600/20"
              title="도움 요청을 완료(resolved) 상태로 변경합니다"
            >
              ✓ 도움 완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
