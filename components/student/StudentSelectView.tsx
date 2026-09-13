"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentClassData, setCurrentClassData } from "@/lib/tempStore";
import { createClassData } from "@/lib/createClassData";
import { getRoleLabels, getJosa } from "@/lib/roleLabels";
import type { ClassFlowData } from "@/types";
import StudentSelector from "./StudentSelector";

// 학생/수강생 선택 메인 뷰 컴포넌트 (STEP 16 범용화)
export default function StudentSelectView() {
  const [data, setData] = useState<ClassFlowData | null>(null);

  useEffect(() => {
    // 1. 메모리 저장소에서 현재 수업/강의 데이터 가져오기
    let currentData = getCurrentClassData();

    // 새로고침 등으로 데이터가 없으면 기본값으로 자동 생성
    if (!currentData) {
      currentData = createClassData({
        className: "AI와 피지컬 컴퓨팅",
        studentCount: 20,
        lessonCount: 10,
        createdAt: new Date().toISOString(),
      });
      setCurrentClassData(currentData);
    }

    setData(currentData);
  }, []);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        목록을 불러오는 중입니다...
      </div>
    );
  }

  const { settings, students } = data;
  const roleLabels = getRoleLabels(settings);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col">
      {/* 1. 상단 안내 헤더 및 MVP 테스트 모드 알림 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="text-xl font-extrabold tracking-tight text-slate-900 hover:opacity-90"
            >
              Class<span className="text-blue-600">Flow</span>
            </Link>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {roleLabels.participant} 화면
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/teacher"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
            >
              {roleLabels.instructor} 화면으로 이동 →
            </Link>
          </div>
        </div>

        {/* MVP 테스트 모드 안내 배너 */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed mb-4">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <span>⚠</span>
            <span>MVP 테스트 모드</span>
          </div>
          <p className="text-amber-800">
            현재 버전에는 실제 {roleLabels.participant} 인증 기능이 없습니다. 대시보드를 테스트할 {getJosa(roleLabels.participant, "을/를")} 선택해 주세요.
          </p>
        </div>

        {/* 현재 강의 정보 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            강의명: <strong className="text-slate-800 font-bold">{settings.className}</strong>
          </div>
          <div>
            전체 {roleLabels.participant}: <strong className="text-blue-600 font-bold">{students.length}명</strong>
          </div>
        </div>
      </div>

      {/* 2. 참여자 선택 그리드 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
          <span>👥</span>
          <span>{getJosa(roleLabels.participant, "을/를")} 선택하세요 ({students.length}명)</span>
        </h2>
        <StudentSelector students={students} />
      </div>
    </div>
  );
}
