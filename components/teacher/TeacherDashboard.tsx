"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  getCurrentClassData,
  setCurrentClassData,
  resolveHelpRequest as resolveLocalHelpRequest,
  toggleLessonPublished as toggleLocalLessonPublished,
} from "@/lib/tempStore";
import { createClassData } from "@/lib/createClassData";
import { buildHelpQueue } from "@/lib/helpQueue";
import {
  getCourseDocument,
  getCourseParticipants,
  getCourseLessons,
  subscribeCourseProgress,
  subscribeCourseHelpRequests,
  resolveHelpRequest as resolveFirestoreHelpRequest,
  type CourseDocument,
} from "@/lib/firestore";
import type { ClassFlowData, Student, Lesson, Progress, HelpRequest } from "@/types";
import DashboardSummary from "./DashboardSummary";
import ClassSettingsPanel from "./ClassSettingsPanel";
import LessonVisibilityManager from "./LessonVisibilityManager";
import HelpQueue from "./HelpQueue";
import ProgressGrid from "./ProgressGrid";
import { getRoleLabels } from "@/lib/roleLabels";

// Teacher/Instructor Dashboard 메인 클라이언트 컴포넌트 (STEP 26 Firestore 실시간 전환)
export default function TeacherDashboard() {
  // 모드 상태: "loading" | "firestore" | "local" | "error"
  const [dashboardMode, setDashboardMode] = useState<
    "loading" | "firestore" | "local" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 로컬 모드용 상태
  const [localData, setLocalData] = useState<ClassFlowData | null>(null);

  // Firestore 모드용 상태
  const [firestoreCourse, setFirestoreCourse] = useState<CourseDocument | null>(null);
  const [firestoreStudents, setFirestoreStudents] = useState<Student[]>([]);
  const [firestoreLessons, setFirestoreLessons] = useState<Lesson[]>([]);
  const [firestoreProgress, setFirestoreProgress] = useState<Progress[]>([]);
  const [firestoreHelpRequests, setFirestoreHelpRequests] = useState<HelpRequest[]>([]);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  // 컴포넌트 마운트 및 Firestore/로컬 모드 판별 (요구사항 #2, #3, #4, #51, #52)
  useEffect(() => {
    let isCancelled = false;
    let unsubProgress: (() => void) | null = null;
    let unsubHelp: (() => void) | null = null;

    async function initializeDashboard() {
      try {
        const stored = getCurrentClassData();
        const courseId = stored?.settings?.courseId;

        // 1. settings.courseId가 존재하는 경우 -> Firestore 강의 확인 시도 (요구사항 #2, #3)
        if (courseId) {
          try {
            const courseDoc = await getCourseDocument(courseId);

            if (isCancelled) return;

            if (courseDoc) {
              // Firestore 강의가 정상 확인됨 -> Firestore Teacher Mode 진입 (요구사항 #2, #4)
              setFirestoreCourse(courseDoc);

              // 1회성 로드: 수강생 및 차시 목록 조회 (요구사항 #5, #6, #11, #48)
              const [participants, lessons] = await Promise.all([
                getCourseParticipants(courseId),
                getCourseLessons(courseId),
              ]);

              if (isCancelled) return;

              setFirestoreStudents(participants);
              setFirestoreLessons(lessons);

              // 실시간 리스너 연결: Progress 컬렉션 전체 1개 (요구사항 #7, #9, #48)
              unsubProgress = subscribeCourseProgress(
                courseId,
                (progressList) => {
                  if (!isCancelled) {
                    setFirestoreProgress(progressList);
                  }
                },
                (err) => {
                  if (!isCancelled) {
                    setRealtimeError(`진행 상태 실시간 연동 오류: ${err.message}`);
                  }
                }
              );

              // 실시간 리스너 연결: HelpRequests 컬렉션 전체 1개 (요구사항 #8, #9, #48)
              unsubHelp = subscribeCourseHelpRequests(
                courseId,
                (helpList) => {
                  if (!isCancelled) {
                    setFirestoreHelpRequests(helpList);
                  }
                },
                (err) => {
                  if (!isCancelled) {
                    setRealtimeError(`도움 요청 실시간 연동 오류: ${err.message}`);
                  }
                }
              );

              setDashboardMode("firestore");
              return;
            } else {
              // courseId가 저장되어 있으나 Firestore에 문서가 존재하지 않는 경우 (요구사항 #4)
              setErrorMessage(
                `저장된 강의 ID(${courseId})에 해당하는 온라인 강의 문서를 찾을 수 없습니다.`
              );
              setDashboardMode("error");
              return;
            }
          } catch (firestoreErr) {
            console.error(
              "[ClassFlow] Firestore 강의 로드 실패, 로컬 모드로 전환합니다:",
              firestoreErr
            );
            // Firestore 접속 에러 시 저장된 로컬 데이터로 대체 진행
          }
        }

        // 2. courseId가 없거나 로컬 수업인 경우 -> Demo / Local MVP mode 유지 (요구사항 #2, #51)
        let currentData = stored;
        if (!currentData) {
          currentData = createClassData({
            className: "AI와 피지컬 컴퓨팅",
            studentCount: 20,
            lessonCount: 10,
            createdAt: new Date().toISOString(),
          });
          setCurrentClassData(currentData);
        }

        if (!isCancelled) {
          setLocalData(currentData);
          setDashboardMode("local");
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMessage(`대시보드 초기화 실패: ${msg}`);
          setDashboardMode("error");
        }
      }
    }

    initializeDashboard();

    // React effect cleanup: 리스너 구독 안전 해제 (요구사항 #9, #10)
    return () => {
      isCancelled = true;
      if (unsubProgress) unsubProgress();
      if (unsubHelp) unsubHelp();
    };
  }, []);

  // 교사/강사의 도움 완료(resolve) 처리 핸들러 (STEP 26, 요구사항 #25, #26, #27)
  const handleResolveHelp = async (helpRequestId: string) => {
    if (dashboardMode === "firestore" && firestoreCourse) {
      try {
        await resolveFirestoreHelpRequest(
          firestoreCourse.courseId,
          helpRequestId
        );
        // 별도의 수동 setState 없이 onSnapshot 리스너가 status='resolved'를 감지하여 자동 갱신됨
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`도움 완료 처리 실패: ${msg}`);
      }
    } else {
      // 로컬 모드 도움 완료 (STEP 10)
      const success = resolveLocalHelpRequest(helpRequestId);
      if (success) {
        const latest = getCurrentClassData();
        if (latest) {
          setLocalData(latest);
        }
      }
    }
  };

  // 차시 공개/비공개 토글 핸들러
  const handleToggleLesson = (
    lessonId: string,
    currentPublished: boolean,
    title: string
  ) => {
    if (dashboardMode === "firestore") {
      // 요구사항 #39: 이번 STEP에서 Lesson Visibility Firestore sync는 구현하지 않음
      alert(
        "온라인 강의의 차시 공개/비공개 설정 동기화 기능은 다음 단계에서 지원될 예정입니다.\n(현재는 강의 개설 시 설정된 상태로 유지됩니다.)"
      );
      return;
    }

    // 로컬 모드 토글 (STEP 12)
    const currentRoleLabels = getRoleLabels(localData?.settings);
    if (currentPublished) {
      const confirmed = window.confirm(
        `'${title}'를 비공개로 변경할까요?\n\n${currentRoleLabels.participant}은(는) 더 이상 이 차시에 접근할 수 없습니다.\n(기존 진행 데이터와 피드백은 안전하게 보존됩니다.)`
      );
      if (!confirmed) return;
    }

    const success = toggleLocalLessonPublished(lessonId);
    if (success) {
      const latest = getCurrentClassData();
      if (latest) {
        setLocalData(latest);
      }
    }
  };

  // 학급 기본 설정 갱신 핸들러
  const handleSettingsUpdated = () => {
    if (dashboardMode === "firestore") {
      // 요구사항 #40: 온라인 수강생 이름/설정 동기화는 다음 단계 지원 안내
      alert(
        "온라인 강의의 수강생 명단 및 설정 수정 동기화는 다음 단계에서 지원될 예정입니다."
      );
      return;
    }
    const latest = getCurrentClassData();
    if (latest) {
      setLocalData(latest);
    }
  };

  // 1. 로딩 상태 렌더링 (요구사항 #41)
  if (dashboardMode === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-sm gap-2">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>강의 데이터를 불러오는 중입니다...</span>
      </div>
    );
  }

  // 2. 오류 상태 렌더링 (요구사항 #4)
  if (dashboardMode === "error" || errorMessage) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          강의를 불러올 수 없습니다
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          {errorMessage || "강의 정보를 조회하는 중 오류가 발생했습니다."}
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/setup"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
          >
            새 강의 설정하러 가기
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // 3. Firestore Teacher Mode 데이터 매핑
  if (dashboardMode === "firestore" && firestoreCourse) {
    const firestoreSettings = {
      className: firestoreCourse.title,
      studentCount: firestoreCourse.studentCount,
      lessonCount: firestoreCourse.lessonCount,
      createdAt: firestoreCourse.createdAt || new Date().toISOString(),
      courseId: firestoreCourse.courseId,
      courseCode: firestoreCourse.courseCode,
      roleLabels: firestoreCourse.roleLabels,
    };

    const roleLabels = getRoleLabels(firestoreSettings);

    // 전체 ClassFlowData 구조 조립 (helpQueue 등에 호환)
    const combinedData: ClassFlowData = {
      settings: firestoreSettings,
      students: firestoreStudents,
      lessons: firestoreLessons,
      progress: firestoreProgress,
      helpRequests: firestoreHelpRequests,
      submissions: [],
      feedback: [],
    };

    // Help Queue 산출 (dedup, priority, timestamp 정렬 자동 적용, 요구사항 #16~#24)
    const helpQueueItems = buildHelpQueue(combinedData);

    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col">
        {/* 실시간 연결 상태 배지 (요구사항 #45) */}
        <div className="flex items-center justify-between gap-2 px-1 mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>실시간 업데이트 중</span>
          </div>
          <span className="text-[11px] text-slate-400">
            수강생이 상태를 변경하면 새로고침 없이 즉시 반영됩니다
          </span>
        </div>

        {/* 실시간 에러 발생 시 부드러운 경고 배너 (요구사항 #43) */}
        {realtimeError && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <span>⚠️</span>
            <span>{realtimeError}</span>
          </div>
        )}

        {/* 1. 상단 요약 헤더 */}
        <DashboardSummary settings={firestoreSettings} />

        {/* 2. 실시간 도움 요청 대기열 (Help Queue - 1순위 즉각 조치 영역) */}
        <HelpQueue
          items={helpQueueItems}
          onResolve={handleResolveHelp}
          roleLabels={roleLabels}
        />

        {/* 3. 참여자 × 차시 진행도 격자판 (Progress Grid - 2순위 전체 학습 상황 영역) */}
        <ProgressGrid
          students={firestoreStudents}
          lessons={firestoreLessons}
          progress={firestoreProgress}
          onToggleLesson={handleToggleLesson}
          roleLabels={roleLabels}
        />

        {/* 4. 차시 공개 관리 패널 */}
        <LessonVisibilityManager
          lessons={firestoreLessons}
          onToggleLesson={handleToggleLesson}
          roleLabels={roleLabels}
        />

        {/* 5. 학급 기본 설정 패널 */}
        <ClassSettingsPanel
          settings={firestoreSettings}
          students={firestoreStudents}
          onSettingsUpdated={handleSettingsUpdated}
        />
      </div>
    );
  }

  // 4. Local / Demo Mode 데이터 렌더링 (기존 100% 동작 보존, 요구사항 #51)
  if (!localData) {
    return null;
  }

  const { settings, students, lessons, progress } = localData;
  const roleLabels = getRoleLabels(settings);
  const helpQueueItems = buildHelpQueue(localData);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col">
      {/* 1. 상단 요약 헤더 */}
      <DashboardSummary settings={settings} />

      {/* 2. 실시간 도움 요청 대기열 (Help Queue - 1순위 즉각 조치 영역) */}
      <HelpQueue
        items={helpQueueItems}
        onResolve={handleResolveHelp}
        roleLabels={roleLabels}
      />

      {/* 3. 참여자 × 차시 진행도 격자판 (Progress Grid - 2순위 전체 학습 상황 영역) */}
      <ProgressGrid
        students={students}
        lessons={lessons}
        progress={progress}
        onToggleLesson={handleToggleLesson}
        roleLabels={roleLabels}
      />

      {/* 4. 차시 공개 관리 패널 (3순위 차시 운영 관리) */}
      <LessonVisibilityManager
        lessons={lessons}
        onToggleLesson={handleToggleLesson}
        roleLabels={roleLabels}
      />

      {/* 5. 학급 기본 설정 패널 (4순위 학급 메타정보 설정) */}
      <ClassSettingsPanel
        settings={settings}
        students={students}
        onSettingsUpdated={handleSettingsUpdated}
      />
    </div>
  );
}

