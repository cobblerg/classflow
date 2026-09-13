"use client";

import { useMemo } from "react";
import type { Student, Lesson, Progress } from "@/types";
import ProgressCell from "./ProgressCell";

interface ProgressGridProps {
  students: Student[];   // 학생 목록 (세로 행)
  lessons: Lesson[];     // 차시 목록 (가로 열)
  progress: Progress[];  // 전체 진행 상태 데이터
  onToggleLesson?: (lessonId: string, currentPublished: boolean, title: string) => void;
}

// 정보 밀도가 향상된 학생 × 차시 진행도 격자판(Progress Grid) 컴포넌트
export default function ProgressGrid({
  students,
  lessons,
  progress,
  onToggleLesson,
}: ProgressGridProps) {
  // 1. 빠른 조회를 위해 "학생ID_차시ID"를 키로 하는 Map 생성 (O(1) 조회)
  const progressMap = useMemo(() => {
    const map = new Map<string, Progress>();
    for (const p of progress) {
      map.set(`${p.studentId}_${p.lessonId}`, p);
    }
    return map;
  }, [progress]);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col mb-4">
      {/* 1. 상단 바: 타이틀 및 컴팩트 상태 범례(Legend, 요구사항 #21) */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="격자판">📊</span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            학습 진행 현황 (Progress Grid)
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {students.length}명 × {lessons.length}차시 ({progress.length}개 셀)
          </span>
        </div>

        {/* 컴팩트 인라인 범례 (Legend) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <span role="img" aria-hidden="true">⚪</span> 시작 전
          </span>
          <span className="inline-flex items-center gap-1">
            <span role="img" aria-hidden="true">🟡</span> 진행 중
          </span>
          <span className="inline-flex items-center gap-1">
            <span role="img" aria-hidden="true">🟢</span> 완료
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
            <span role="img" aria-hidden="true">🔴</span> 도움 필요
          </span>
          <span className="inline-flex items-center gap-1">
            <span role="img" aria-hidden="true">🤔</span> 어려움
          </span>
          <span className="inline-flex items-center gap-1">
            <span role="img" aria-hidden="true">🔒</span> 비공개
          </span>
        </div>
      </div>

      {/* 2. 가로/세로 스크롤 가능한 Grid 컨테이너 (요구사항 #15, #16) */}
      <div className="overflow-auto max-h-[620px] relative scrollbar-thin">
        <table className="w-full border-separate border-spacing-0 text-center select-none">
          <caption className="sr-only">
            학생별 차시 진행 현황 및 이해도 그리드 표
          </caption>

          {/* Header 영역 (차시 목록) */}
          <thead>
            <tr>
              {/* 좌상단 학생 Header 코너 (가로·세로 모두 sticky 고정, 요구사항 #14) */}
              <th
                scope="col"
                className="sticky top-0 left-0 z-30 bg-slate-100 text-xs font-bold text-slate-700 py-2.5 px-3 min-w-[100px] sm:min-w-[120px] text-left border-b-2 border-r border-slate-200 shadow-[2px_2px_4px_rgba(0,0,0,0.04)]"
              >
                학생 ({students.length}명)
              </th>

              {/* 각 차시 헤더 셀 (세로 sticky top-0 고정, 요구사항 #13, #18, #34) */}
              {lessons.map((lesson) => (
                <th
                  key={lesson.id}
                  scope="col"
                  className="sticky top-0 z-20 bg-slate-100 text-xs font-bold text-slate-700 py-2 px-1 min-w-[56px] sm:min-w-[64px] border-b-2 border-r border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    {/* 차시 번호 */}
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-tight leading-tight">
                      {lesson.number}차시
                    </span>

                    {/* 긴 차시 제목 방어용 말줄임표(truncate) 및 title 툴팁 (요구사항 #18, #34) */}
                    <span
                      className="text-[10px] text-slate-500 font-normal truncate max-w-[50px] sm:max-w-[58px] leading-tight"
                      title={lesson.title}
                    >
                      {lesson.title}
                    </span>

                    {/* 공개/비공개 토글 버튼 */}
                    {onToggleLesson ? (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleLesson(
                            lesson.id,
                            lesson.published,
                            `${lesson.number}차시 (${lesson.title})`
                          )
                        }
                        className={`mt-0.5 text-[9px] font-semibold px-1 py-0.5 rounded leading-none transition-all active:scale-95 cursor-pointer ${
                          lesson.published
                            ? "text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300"
                            : "text-slate-600 bg-slate-200 hover:bg-slate-300 border border-slate-300"
                        }`}
                        title={`클릭하여 ${lesson.published ? "비공개로" : "공개로"} 전환`}
                        aria-label={`${lesson.number}차시 ${lesson.published ? "비공개로 변경" : "공개로 변경"}`}
                      >
                        {lesson.published ? "🔓공개" : "🔒비공개"}
                      </button>
                    ) : (
                      <span
                        className={`mt-0.5 text-[9px] font-normal px-1 py-0.2 rounded leading-none ${
                          lesson.published
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200/80"
                            : "text-slate-400 bg-slate-200/60"
                        }`}
                        title={lesson.published ? "공개된 차시" : "비공개 차시"}
                      >
                        {lesson.published ? "🔓공개" : "🔒비공개"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body 영역 (학생 목록 및 진행 상태 Cell) */}
          <tbody>
            {students.map((student, index) => {
              const isEvenRow = index % 2 === 0;
              return (
                <tr
                  key={student.id}
                  className={`transition-colors ${
                    isEvenRow ? "bg-white" : "bg-slate-50/50"
                  } hover:bg-blue-50/40`}
                >
                  {/* 첫 번째 학생 이름 열 (가로 sticky left-0 고정, 요구사항 #12) */}
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 font-medium text-xs sm:text-sm text-slate-800 py-1 px-2.5 text-left border-b border-r border-slate-200 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)] ${
                      isEvenRow ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <span className="text-slate-400 font-mono text-[11px] mr-1.5 font-normal">
                      {String(student.number).padStart(2, "0")}
                    </span>
                    <span className="font-semibold">{student.name}</span>
                  </th>

                  {/* 각 차시별 진행도 Cell */}
                  {lessons.map((lesson) => {
                    const cellProgress = progressMap.get(
                      `${student.id}_${lesson.id}`
                    );
                    return (
                      <td
                        key={lesson.id}
                        className="border-b border-r border-slate-200/70 p-0"
                      >
                        <ProgressCell
                          progress={cellProgress}
                          isPublished={lesson.published}
                          studentId={student.id}
                          lessonId={lesson.id}
                          studentName={student.name}
                          lessonNumber={lesson.number}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Grid 하단 안내 바 (요구사항 #17) */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200/70 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1.5">
        <span className="flex items-center gap-1">
          <span>↔</span> 좌우 스크롤로 모든 차시를 확인하고, 상하 스크롤로 모든 학생을 확인할 수 있습니다.
        </span>
        <span className="text-slate-400 font-medium">
          각 셀 클릭 시 해당 학생의 차시 상세 화면으로 이동합니다.
        </span>
      </div>
    </div>
  );
}
