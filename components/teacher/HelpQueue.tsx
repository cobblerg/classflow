"use client";

import { useState } from "react";
import type { HelpQueueItemType } from "@/lib/helpQueue";
import HelpQueueItem from "./HelpQueueItem";

interface HelpQueueProps {
  items: HelpQueueItemType[];
  onResolve: (helpRequestId: string) => void;
}

// 교사 대시보드의 실시간 도움 요청 대기열(Help Queue) 패널 컴포넌트 (STEP 10, STEP 14 개선)
export default function HelpQueue({ items, onResolve }: HelpQueueProps) {
  const [showAll, setShowAll] = useState(false);
  const directRequestCount = items.filter((i) => i.hasWaitingRequest).length;

  // 처음에는 최대 5개만 표시하여 대기열이 Progress Grid를 과도하게 밀어내지 않도록 방지 (요구사항 #7)
  const INITIAL_LIMIT = 5;
  const visibleItems = showAll ? items : items.slice(0, INITIAL_LIMIT);
  const hasMore = items.length > INITIAL_LIMIT;

  return (
    <section className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm mb-4">
      {/* 1. 상단 헤더: 제목 및 카운트 배지 */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl" role="img" aria-label="경고 아이콘">🚨</span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            도움이 필요한 학생
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            총 {items.length}명
          </span>
          {directRequestCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              🙋 직접 요청 {directRequestCount}명
            </span>
          )}
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          우선순위순 정렬
        </span>
      </div>

      {/* 2. 대기열 목록 또는 빈 상태 안내 */}
      {items.length === 0 ? (
        <div className="py-5 px-4 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <span className="text-xl block mb-1">🎉</span>
          <p className="text-sm font-semibold text-slate-700 mb-0.5">
            현재 도움을 기다리는 학생이 없습니다
          </p>
          <p className="text-xs text-slate-400">
            모든 학생이 원활하게 수업 과제를 수행하고 있습니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visibleItems.map((item) => (
            <HelpQueueItem
              key={item.id}
              item={item}
              onResolve={onResolve}
            />
          ))}

          {/* 5개 초과 시 더 보기 / 접기 버튼 (요구사항 #7, #36) */}
          {hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] transition-all cursor-pointer border border-slate-200"
              >
                {showAll ? (
                  <>▲ 간략히 보기 (5명만 표시)</>
                ) : (
                  <>▼ 전체 {items.length}명 모두 보기 ({items.length - INITIAL_LIMIT}명 더 있음)</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
