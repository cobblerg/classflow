"use client";

import { useEffect, useState } from "react";
import {
  getCurrentClassData,
  setCurrentClassData,
  resolveHelpRequest,
} from "@/lib/tempStore";
import { createClassData } from "@/lib/createClassData";
import { buildHelpQueue } from "@/lib/helpQueue";
import type { ClassFlowData } from "@/types";
import DashboardSummary from "./DashboardSummary";
import HelpQueue from "./HelpQueue";
import ProgressGrid from "./ProgressGrid";

// Teacher Dashboard 메인 클라이언트 컴포넌트
export default function TeacherDashboard() {
  const [data, setData] = useState<ClassFlowData | null>(null);

  useEffect(() => {
    // 1. 메모리 저장소에서 현재 수업 데이터 가져오기 (localStorage 복원 포함)
    let currentData = getCurrentClassData();

    // 2. 만약 저장된 데이터가 전혀 없는 경우 기본값으로 자동 생성
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

  // 교사의 도움 완료(resolve) 처리 핸들러 (STEP 10)
  const handleResolveHelp = (helpRequestId: string) => {
    const success = resolveHelpRequest(helpRequestId);
    if (success) {
      // 최신 데이터를 다시 불러와 대시보드 상태 즉시 갱신
      const latest = getCurrentClassData();
      if (latest) {
        setData(latest);
      }
    }
  };

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        대시보드 데이터를 불러오는 중입니다...
      </div>
    );
  }

  const { settings, students, lessons, progress } = data;

  // 전체 데이터로부터 도움 대기열(Help Queue) 산출
  const helpQueueItems = buildHelpQueue(data);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col">
      {/* 1. 상단 요약 헤더 */}
      <DashboardSummary settings={settings} />

      {/* 2. 실시간 도움 요청 대기열 (Help Queue, STEP 10) */}
      <HelpQueue
        items={helpQueueItems}
        onResolve={handleResolveHelp}
      />

      {/* 3. 학생 × 차시 진행도 격자판 (Progress Grid) */}
      <ProgressGrid
        students={students}
        lessons={lessons}
        progress={progress}
      />
    </div>
  );
}
