"use client";

import { useEffect, useState } from "react";
import { getCurrentClassData, setCurrentClassData } from "@/lib/tempStore";
import { createClassData } from "@/lib/createClassData";
import type { ClassFlowData } from "@/types";
import DashboardSummary from "./DashboardSummary";
import ProgressGrid from "./ProgressGrid";

// Teacher Dashboard 메인 클라이언트 컴포넌트
export default function TeacherDashboard() {
  const [data, setData] = useState<ClassFlowData | null>(null);

  useEffect(() => {
    // 1. 메모리 저장소에서 현재 수업 데이터 가져오기
    let currentData = getCurrentClassData();

    // 2. 만약 새로고침 등으로 메모리에 데이터가 없는 경우 기본값으로 자동 생성
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
        대시보드 데이터를 불러오는 중입니다...
      </div>
    );
  }

  const { settings, students, lessons, progress } = data;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col">
      {/* 1. 상단 요약 헤더 */}
      <DashboardSummary settings={settings} />

      {/* 2. 학생 × 차시 진행도 격자판 (Progress Grid) */}
      <ProgressGrid
        students={students}
        lessons={lessons}
        progress={progress}
      />
    </div>
  );
}
