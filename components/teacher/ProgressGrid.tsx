"use client";

import { useMemo } from "react";
import type { Student, Lesson, Progress } from "@/types";
import ProgressCell from "./ProgressCell";

interface ProgressGridProps {
  students: Student[];   // 학생 목록 (세로 행)
  lessons: Lesson[];     // 차시 목록 (가로 열)
  progress: Progress[];  // 전체 진행 상태 데이터
}

// 정보 밀도가 향상된 학생 × 차시 진행도 격자판(Progress Grid) 컴포넌트
export default function ProgressGrid({
  students,
  lessons,
  progress,
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
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* 2. 가로/세로 스크롤 가능한 컴팩트 Grid 컨테이너 */}
      <div className="overflow-auto max-h-[calc(100vh-230px)] relative">
        <table className="w-full border-separate border-spacing-0 text-center select-none">
          {/* Header 영역 (차시 목록) */}
          <thead>
            <tr>
              {/* 좌상단 학생 Header 코너 (가로·세로 모두 sticky 고정 유지) */}
              <th
                scope="col"
                className="sticky top-0 left-0 z-30 bg-slate-100/95 backdrop-blur-sm text-xs font-bold text-slate-700 py-2.5 px-3 min-w-[110px] sm:min-w-[130px] text-left border-b-2 border-r border-slate-200 shadow-[2px_2px_4px_rgba(0,0,0,0.04)]"
              >
                학생 ({students.length})
              </th>

              {/* 각 차시 헤더 셀 (세로 sticky top-0 고정 유지) */}
              {lessons.map((lesson) => (
                <th
                  key={lesson.id}
                  scope="col"
                  className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm text-xs font-bold text-slate-700 py-2 px-1.5 min-w-[64px] sm:min-w-[74px] border-b-2 border-r border-slate-200"
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="text-xs font-semibold text-slate-800 tracking-tight">
                      {lesson.title}
                    </span>
                    <span
                      className={`text-[9px] font-normal px-1 py-0.2 rounded leading-tight ${
                        lesson.published
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200/80"
                          : "text-slate-400 bg-slate-200/60"
                      }`}
                      title={lesson.published ? "공개된 차시" : "비공개 차시"}
                    >
                      {lesson.published ? "🔓공개" : "🔒비공개"}
                    </span>
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
                    isEvenRow ? "bg-white" : "bg-slate-50/40"
                  } hover:bg-blue-50/30`}
                >
                  {/* 첫 번째 학생 이름 열 (가로 sticky left-0 고정 유지) */}
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 font-medium text-xs sm:text-sm text-slate-800 py-1.5 px-3 text-left border-b border-r border-slate-200/90 whitespace-nowrap shadow-[2px_0_4px_rgba(0,0,0,0.03)] ${
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

      {/* Grid 하단 상태 요약 바 */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200/70 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1.5">
        <span>
          💡 가로/세로 스크롤 시 학생 이름과 차시 제목이 상단 및 좌측에 고정됩니다.
        </span>
        <span className="font-mono text-slate-400">
          총 {students.length}명 × {lessons.length}차시 ({progress.length}개 셀)
        </span>
      </div>
    </div>
  );
}
