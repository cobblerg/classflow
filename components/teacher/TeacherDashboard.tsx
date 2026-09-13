"use client";

import { useEffect, useState } from "react";
import {
  getCurrentClassData,
  setCurrentClassData,
  resolveHelpRequest,
  toggleLessonPublished,
} from "@/lib/tempStore";
import { createClassData } from "@/lib/createClassData";
import { buildHelpQueue } from "@/lib/helpQueue";
import type { ClassFlowData } from "@/types";
import DashboardSummary from "./DashboardSummary";
import ClassSettingsPanel from "./ClassSettingsPanel";
import LessonVisibilityManager from "./LessonVisibilityManager";
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

  // 차시 공개/비공개 토글 핸들러 (STEP 12)
  const handleToggleLesson = (lessonId: string, currentPublished: boolean, title: string) => {
    // 공개 ➡️ 비공개 전환 시 교사 실수 방지 확인 다이얼로그 (요구사항 14번)
    if (currentPublished) {
      const confirmed = window.confirm(
        `'${title}'를 비공개로 변경할까요?\n\n학생은 더 이상 이 차시에 접근할 수 없습니다.\n(기존 진행 데이터와 피드백은 안전하게 보존됩니다.)`
      );
      if (!confirmed) return;
    }

    const success = toggleLessonPublished(lessonId);
    if (success) {
      const latest = getCurrentClassData();
      if (latest) {
        setData(latest);
      }
    }
  };

  // 학급 기본 설정 갱신 핸들러 (STEP 12)
  const handleSettingsUpdated = () => {
    const latest = getCurrentClassData();
    if (latest) {
      setData(latest);
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

      {/* 2. 실시간 도움 요청 대기열 (Help Queue - 1순위 즉각 조치 영역) */}
      <HelpQueue
        items={helpQueueItems}
        onResolve={handleResolveHelp}
      />

      {/* 3. 학생 × 차시 진행도 격자판 (Progress Grid - 2순위 전체 학습 상황 영역) */}
      <ProgressGrid
        students={students}
        lessons={lessons}
        progress={progress}
        onToggleLesson={handleToggleLesson}
      />

      {/* 4. 차시 공개 관리 패널 (3순위 차시 운영 관리) */}
      <LessonVisibilityManager
        lessons={lessons}
        onToggleLesson={handleToggleLesson}
      />

      {/* 5. 학급 기본 설정 패널 (4순위 학급 메타정보 설정) */}
      <ClassSettingsPanel
        settings={settings}
        onSettingsUpdated={handleSettingsUpdated}
      />
    </div>
  );
}
