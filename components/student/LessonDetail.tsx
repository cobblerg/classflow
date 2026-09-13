"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCurrentClassData,
  updateProgressStatus,
  updateUnderstanding,
} from "@/lib/tempStore";
import { getRoleLabels } from "@/lib/roleLabels";
import {
  getJoinedCourseSession,
  type JoinedCourseSession,
} from "@/lib/session";
import { getCourseParticipants } from "@/lib/firestore/participants";
import { getCourseLessons } from "@/lib/firestore/lessons";
import {
  getParticipantLessonProgress,
  saveParticipantLessonProgress,
} from "@/lib/firestore/progress";
import type {
  ClassFlowData,
  Student,
  Lesson,
  Progress,
  ProgressStatus,
  Understanding,
  RoleLabels,
} from "@/types";
import ProgressStatusSelector from "./ProgressStatusSelector";
import UnderstandingSelector from "./UnderstandingSelector";
import HelpRequestPanel from "./HelpRequestPanel";

interface LessonDetailProps {
  studentId: string; // 학생 고유 ID
  lessonId: string; // 차시 고유 ID
}

// 학생 과제 상세 화면 컴포넌트 (STEP 24: Firestore Progress/Understanding 실시간 연동)
export default function LessonDetail({ studentId, lessonId }: LessonDetailProps) {
  // 온라인 모드 세션
  const [joinedSession, setJoinedSession] = useState<JoinedCourseSession | null>(null);

  // 데이터 상태
  const [localData, setLocalData] = useState<ClassFlowData | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<
    | "student_not_found"
    | "lesson_not_found"
    | "no_course"
    | "unauthorized_participant"
    | null
  >(null);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [onlineNotice, setOnlineNotice] = useState<string | null>(null);

  useEffect(() => {
    // 1. 온라인 세션 확인 (요구사항 #16)
    const session = getJoinedCourseSession();

    if (session && session.courseId) {
      setJoinedSession(session);

      // 세션의 수강생 ID와 URL의 studentId가 일치하는지 검증 (요구사항 #33, #34)
      if (session.participantId && session.participantId !== studentId) {
        setErrorType("unauthorized_participant");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Firestore에서 participants, lessons, 그리고 현재 차시 progress 동시 로드 (새로고침 F5 복원 지원, 요구사항 #26, #54)
      Promise.all([
        getCourseParticipants(session.courseId),
        getCourseLessons(session.courseId),
        getParticipantLessonProgress(session.courseId, studentId, lessonId),
      ])
        .then(([participants, lessons, currentProgress]) => {
          const foundStudent = participants.find((p) => p.id === studentId);
          if (!foundStudent) {
            setErrorType("student_not_found");
            setIsLoading(false);
            return;
          }
          setStudent(foundStudent);

          const foundLesson = lessons.find((l) => l.id === lessonId);
          if (!foundLesson) {
            setErrorType("lesson_not_found");
            setIsLoading(false);
            return;
          }
          setLesson(foundLesson);

          // Firestore에서 로드한 Progress 설정 (문서 없으면 기본값 not_started, null, 요구사항 #10, #27)
          setProgress(currentProgress);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("[ClassFlow] LessonDetail Firestore 로드 오류:", err);
          setErrorType("no_course");
          setIsLoading(false);
        });
    } else {
      // 2. 로컬스토리지 모드 확인 (기존 모드 유지, 요구사항 #17)
      setIsLoading(false);
      const currentData = getCurrentClassData();

      if (!currentData) {
        setErrorType("no_course");
        return;
      }

      setLocalData(currentData);

      const foundStudent = currentData.students.find((s) => s.id === studentId);
      if (!foundStudent) {
        setErrorType("student_not_found");
        return;
      }
      setStudent(foundStudent);

      const foundLesson = currentData.lessons.find((l) => l.id === lessonId);
      if (!foundLesson) {
        setErrorType("lesson_not_found");
        return;
      }
      setLesson(foundLesson);

      const foundProgress = currentData.progress.find(
        (p) => p.studentId === foundStudent.id && p.lessonId === foundLesson.id
      );
      if (foundProgress) {
        setProgress(foundProgress);
      }
    }
  }, [studentId, lessonId]);

  // 역할 라벨 계산
  const roleLabels: RoleLabels = joinedSession
    ? joinedSession.roleLabels
    : getRoleLabels(localData?.settings);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-sm">
        <div className="text-3xl mb-3 animate-spin">⏳</div>
        <span>과제 정보를 불러오는 중입니다...</span>
      </div>
    );
  }

  // 강의 데이터 없음
  if (errorType === "no_course") {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-4">🚪</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          입장한 강의가 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          강의 코드로 먼저 입장해 주세요.
        </p>
        <Link
          href="/join"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          🔑 강의 코드로 입장하기
        </Link>
      </div>
    );
  }

  // 다른 수강생 URL 접근 차단 (요구사항 #33, #34)
  if (errorType === "unauthorized_participant") {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-amber-200 shadow-sm text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          접근 제한
        </h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          현재 입장하신 본인({joinedSession?.participantName || "수강생"})의 과제만 조회 및 변경할 수 있습니다.
        </p>
        <Link
          href="/student"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← {roleLabels.participant} 선택으로 돌아가기
        </Link>
      </div>
    );
  }

  // 예외 처리 A: 존재하지 않는 studentId
  if (errorType === "student_not_found" || !student) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {roleLabels.participant}을(를) 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          요청하신 ID (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">{studentId}</code>)는 존재하지 않습니다.
        </p>
        <Link
          href="/student"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← {roleLabels.participant} 선택으로 돌아가기
        </Link>
      </div>
    );
  }

  // 예외 처리 B: 존재하지 않는 lessonId
  if (errorType === "lesson_not_found" || !lesson) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          차시를 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          요청하신 차시 ID (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">{lessonId}</code>)는 존재하지 않습니다.
        </p>
        <Link
          href={`/student/${studentId}`}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← 나의 학습으로 돌아가기
        </Link>
      </div>
    );
  }

  // 예외 처리 C: 비공개 차시 접근 차단 (요구사항 #37, #59)
  if (!lesson.published) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          아직 공개되지 않은 차시입니다
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {roleLabels.instructor}가 차시를 공개하면 과제를 확인하고 학습을 진행할 수 있습니다.
        </p>
        <Link
          href={`/student/${studentId}`}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← 나의 학습으로 돌아가기
        </Link>
      </div>
    );
  }

  // 안내 알림 헬퍼
  const showNotice = (msg: string) => {
    setOnlineNotice(msg);
    setTimeout(() => {
      setOnlineNotice(null);
    }, 3500);
  };

  // 8. 진행 상태 변경 핸들러 (STEP 24: Firestore 연동)
  const handleStatusChange = async (newStatus: ProgressStatus) => {
    if (!student || !lesson || isSaving) return;

    const labelMap: Record<ProgressStatus, string> = {
      not_started: "시작 전",
      in_progress: "진행 중",
      completed: "완료",
    };

    // [A] Firestore 온라인 입장 모드인 경우 (요구사항 #16, #19)
    if (joinedSession) {
      setIsSaving(true);
      setFeedbackError(null);

      try {
        const savedProgress = await saveParticipantLessonProgress({
          courseId: joinedSession.courseId,
          participantId: student.id,
          lessonId: lesson.id,
          status: newStatus,
        });

        // 상태 업데이트 및 성공 안내 (요구사항 #19)
        setProgress(savedProgress);
        setFeedbackMsg(`진행 상태가 '${labelMap[newStatus]}'(으)로 저장되었습니다.`);
        setTimeout(() => setFeedbackMsg(null), 2500);
      } catch (err: unknown) {
        console.error("[ClassFlow] Progress 저장 오류:", err);
        // 저장 실패 UX (요구사항 #25, #60)
        setFeedbackError("진행 상태를 저장하지 못했습니다. 다시 시도해 주세요.");
        setTimeout(() => setFeedbackError(null), 4000);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // [B] 로컬스토리지 모드인 경우 (기존 모드 유지, 요구사항 #17)
    const updatedData = updateProgressStatus(student.id, lesson.id, newStatus);
    if (updatedData) {
      setLocalData(updatedData);
      const updatedProgress = updatedData.progress.find(
        (p) => p.studentId === student.id && p.lessonId === lesson.id
      );
      if (updatedProgress) {
        setProgress(updatedProgress);
      }
    }

    setFeedbackMsg(`진행 상태가 '${labelMap[newStatus]}'(으)로 변경되었습니다.`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // 9. 학생 이해도 변경 핸들러 (STEP 24: Firestore 연동)
  const handleUnderstandingChange = async (newUnderstanding: Understanding) => {
    if (!student || !lesson || isSaving) return;

    const labelMap: Record<string, string> = {
      understood: "이해했어요",
      difficult: "어려워요",
      need_help: "도움이 필요해요",
    };

    // [A] Firestore 온라인 입장 모드인 경우 (요구사항 #16, #20, #21)
    if (joinedSession) {
      setIsSaving(true);
      setFeedbackError(null);

      try {
        const savedProgress = await saveParticipantLessonProgress({
          courseId: joinedSession.courseId,
          participantId: student.id,
          lessonId: lesson.id,
          understanding: newUnderstanding, // null 취소 포함 (요구사항 #21)
        });

        setProgress(savedProgress);

        if (newUnderstanding) {
          setFeedbackMsg(`이해 상태가 '${labelMap[newUnderstanding]}'(으)로 저장되었습니다.`);
        } else {
          setFeedbackMsg("이해 상태 선택이 해제되었습니다.");
        }
        setTimeout(() => setFeedbackMsg(null), 2500);
      } catch (err: unknown) {
        console.error("[ClassFlow] Understanding 저장 오류:", err);
        // 저장 실패 UX (요구사항 #25, #60)
        setFeedbackError("이해도를 저장하지 못했습니다. 다시 시도해 주세요.");
        setTimeout(() => setFeedbackError(null), 4000);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // [B] 로컬스토리지 모드인 경우 (기존 모드 유지, 요구사항 #17)
    const updatedData = updateUnderstanding(student.id, lesson.id, newUnderstanding);
    if (updatedData) {
      setLocalData(updatedData);
      const updatedProgress = updatedData.progress.find(
        (p) => p.studentId === student.id && p.lessonId === lesson.id
      );
      if (updatedProgress) {
        setProgress(updatedProgress);
      }
    }

    if (newUnderstanding) {
      setFeedbackMsg(`이해 상태가 '${labelMap[newUnderstanding]}'(으)로 변경되었습니다.`);
    } else {
      setFeedbackMsg("이해 상태 선택이 해제되었습니다.");
    }
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // 10. 도움 요청 조회 (로컬 모드 전용)
  const currentHelpRequest =
    localData?.helpRequests?.find(
      (r) =>
        r.studentId === student.id &&
        r.lessonId === lesson.id &&
        r.status === "waiting"
    ) || null;

  const handleHelpRequestChange = () => {
    if (joinedSession) {
      showNotice("실시간 도움 요청 기능은 준비 중입니다 (다음 단계 지원 예정).");
      return;
    }
    const latestData = getCurrentClassData();
    if (latestData) {
      setLocalData(latestData);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col pb-12">
      {/* 상단 내비게이션 바 */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/student/${student.id}`}
          className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
        >
          ← 나의 학습으로 돌아가기
        </Link>
      </div>

      {/* 온라인 모드 뱃지 안내 */}
      {joinedSession && (
        <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs leading-relaxed mb-6">
          <div className="flex items-center gap-1.5 font-bold mb-0.5">
            <span>🌐</span>
            <span>온라인 강의 모드 (상태 저장 활성화)</span>
          </div>
          <p className="text-blue-800">
            진행 상태 및 이해도를 선택하면 클라우드에 안전하게 실시간 저장됩니다.
          </p>
        </div>
      )}

      {/* 저장 실패 에러 안내 토스트 (요구사항 #25) */}
      {feedbackError && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs font-semibold text-rose-800 flex items-center gap-2 animate-fadeIn shadow-sm"
        >
          <span className="text-base">⚠️</span>
          <span>{feedbackError}</span>
        </div>
      )}

      {/* 알림 토스트 */}
      {onlineNotice && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-900 flex items-center gap-2 animate-fadeIn shadow-sm">
          <span className="text-base">ℹ️</span>
          <span>{onlineNotice}</span>
        </div>
      )}

      {/* 헤더: 수업명 및 차시 제목 */}
      <header className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
          <span>ClassFlow</span>
          <span>•</span>
          <span>{joinedSession ? joinedSession.courseTitle : localData?.settings.className}</span>
          <span>•</span>
          <span className="text-slate-600">{student.name}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {lesson.title}
        </h1>
      </header>

      {/* 🎯 학습 목표 카드 */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-5">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span>학습 목표</span>
        </h2>
        {lesson.objective ? (
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
            {lesson.objective}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">
            아직 학습 목표가 등록되지 않았습니다.
          </p>
        )}
      </section>

      {/* 📋 오늘의 과제 카드 */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-5">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span className="text-xl">📋</span>
          <span>오늘의 과제</span>
        </h2>
        {lesson.description ? (
          <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            {lesson.description}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">
            아직 과제 내용이 등록되지 않았습니다.
          </p>
        )}
      </section>

      {/* 나의 진행 상태 변경 섹션 (STEP 24) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="text-xl">📌</span>
            <span>나의 진행 상태</span>
          </h2>
          <span className="text-xs text-slate-400">
            {isSaving ? "저장 중..." : "자유롭게 변경 가능"}
          </span>
        </div>

        {/* 3가지 상태 선택 버튼 컴포넌트 */}
        <ProgressStatusSelector
          currentStatus={progress?.status || "not_started"}
          onStatusChange={handleStatusChange}
          disabled={isSaving}
        />
      </section>

      {/* 이해 상태 선택 섹션 (STEP 24: 독립 운영) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="text-xl">💭</span>
            <span>이해 상태</span>
          </h2>
          <span className="text-xs text-slate-400">
            {isSaving ? "저장 중..." : "선택 취소 가능"}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          지금 이 학습 내용을 얼마나 이해하고 있나요?
        </p>

        {/* 3가지 이해도 선택 버튼 컴포넌트 */}
        <UnderstandingSelector
          currentUnderstanding={progress?.understanding || null}
          onUnderstandingChange={handleUnderstandingChange}
          disabled={isSaving}
        />

        {/* 상태 변경 성공 피드백 알림 토스트 */}
        {feedbackMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-fadeIn">
            <span>✓</span>
            <span>{feedbackMsg}</span>
          </div>
        )}
      </section>

      {/* 5. 도움 요청 섹션 (HelpRequest는 아직 Firestore 미저장, 요구사항 #41) */}
      {joinedSession ? (
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="text-xl">🙋</span>
              <span>도움 요청</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              준비 중
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            실시간 도움 요청 및 강사 대기열 연동은 향후 단계에서 지원됩니다.
          </p>
          <button
            type="button"
            onClick={() => showNotice("실시간 도움 요청 기능은 준비 중입니다.")}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400 cursor-not-allowed text-center"
          >
            🙋 {roleLabels.instructor}, 도와주세요 (준비 중)
          </button>
        </section>
      ) : (
        <HelpRequestPanel
          studentId={student.id}
          lessonId={lesson.id}
          currentHelpRequest={currentHelpRequest}
          onHelpRequestChange={handleHelpRequestChange}
          roleLabels={roleLabels}
        />
      )}

      {/* 6. 피드백 섹션 (로컬 모드 전용, 요구사항 #42) */}
      {!joinedSession && (
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="text-xl">💬</span>
              <span>{roleLabels.instructor} 피드백</span>
            </h2>
          </div>

          {localData?.feedback?.find((f) => f.studentId === student.id && f.lessonId === lesson.id)?.content ? (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {localData.feedback.find((f) => f.studentId === student.id && f.lessonId === lesson.id)!.content}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-400 italic py-1">
              아직 등록된 {roleLabels.instructor} 피드백이 없습니다.
            </p>
          )}
        </section>
      )}

      {/* 하단 내비게이션 버튼 */}
      <div className="pt-2">
        <Link
          href={`/student/${student.id}`}
          className="w-full inline-flex items-center justify-center px-6 py-4 rounded-2xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] transition-all"
        >
          ← 나의 학습 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
