"use client";

import type { HelpQueueItemType } from "@/lib/helpQueue";
import HelpQueueItem from "./HelpQueueItem";

interface HelpQueueProps {
  items: HelpQueueItemType[];
  onResolve: (helpRequestId: string) => void;
}

// 교사 대시보드의 실시간 도움 요청 대기열(Help Queue) 패널 컴포넌트 (STEP 10)
export default function HelpQueue({ items, onResolve }: HelpQueueProps) {
  const directRequestCount = items.filter((i) => i.hasWaitingRequest).length;

  return (
    <section className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm mb-4">
      {/* 1. 상단 헤더: 제목 및 카운트 배지 */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚨</span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            도움이 필요한 학생
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            총 {items.length}명
          </span>
          {directRequestCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hidden sm:inline-block">
              직접 요청 {directRequestCount}명
            </span>
          )}
        </div>

        <span className="text-xs text-slate-400">
          우선순위 및 대기 시간순 정렬
        </span>
      </div>

      {/* 2. 대기열 목록 또는 빈 상태 안내 */}
      {items.length === 0 ? (
        <div className="py-8 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <span className="text-2xl block mb-2">🎉</span>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            현재 도움을 기다리는 학생이 없습니다
          </p>
          <p className="text-xs text-slate-400">
            모든 학생이 원활하게 수업 과제를 수행하고 있습니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {items.map((item) => (
            <HelpQueueItem
              key={item.id}
              item={item}
              onResolve={onResolve}
            />
          ))}
        </div>
      )}
    </section>
  );
}
