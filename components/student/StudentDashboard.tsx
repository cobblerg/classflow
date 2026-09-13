"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentClassData } from "@/lib/tempStore";
import { getRoleLabels } from "@/lib/roleLabels";
import {
  getJoinedCourseSession,
  clearJoinedCourseSession,
  type JoinedCourseSession,
} from "@/lib/session";
import { getCourseParticipants } from "@/lib/firestore/participants";
import { getCourseLessons } from "@/lib/firestore/lessons";
import { getParticipantProgress } from "@/lib/firestore/progress";
import { getParticipantActiveHelpRequests } from "@/lib/firestore/helpRequests";
import type { ClassFlowData, Student, Lesson, Progress, HelpRequest, RoleLabels } from "@/types";
import LessonCard from "./LessonCard";

interface StudentDashboardProps {
  studentId: string; // URL 경로에서 전달받은 참여자 ID
}

// 개별 참여자(수강생/학생)용 대시보드 컴포넌트 (STEP 25: Firestore HelpRequest 연동 지원)
export default function StudentDashboard({ studentId }: StudentDashboardProps) {
  const router = useRouter();

  // 1. 온라인 세션 모드 상태
  const [joinedSession, setJoinedSession] = useState<JoinedCourseSession | null>(null);
  const [onlineStudent, setOnlineStudent] = useState<Student | null>(null);
  const [onlineLessons, setOnlineLessons] = useState<Lesson[]>([]);
  const [onlineProgressList, setOnlineProgressList] = useState<Progress[]>([]);
  const [onlineHelpRequests, setOnlineHelpRequests] = useState<HelpRequest[]>([]);
  const [isLoadingOnline, setIsLoadingOnline] = useState<boolean>(true);

  // 2. 로컬 모드 상태
  const [localData, setLocalData] = useState<ClassFlowData | null>(null);
  const [localStudent, setLocalStudent] = useState<Student | null>(null);

  // 공통 오류 상태
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [hasNoData, setHasNoData] = useState<boolean>(false);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);

  useEffect(() => {
    // 1. 세션스토리지에서 Firestore 입장 세션 확인 (요구사항 #23)
    const session = getJoinedCourseSession();

    if (session && session.courseId) {
      setJoinedSession(session);

      // 세션에 저장된 수강생 ID와 URL의 studentId가 일치하는지 검증 (요구사항 #33, #34)
      if (session.participantId && session.participantId !== studentId) {
        setIsUnauthorized(true);
        setIsLoadingOnline(false);
        return;
      }

      setIsLoadingOnline(true);

      // Firestore에서 수강생 목록, 차시 목록, 전체 Progress 목록, 대기 중인 도움 요청을 동시 로드
      Promise.all([
        getCourseParticipants(session.courseId),
        getCourseLessons(session.courseId),
        getParticipantProgress(session.courseId, studentId),
        getParticipantActiveHelpRequests(session.courseId, studentId),
      ])
        .then(([participants, lessons, progressList, helpList]) => {
          const found = participants.find((p) => p.id === studentId);
          if (!found) {
            setIsNotFound(true);
          } else {
            setOnlineStudent(found);
            setOnlineLessons(lessons);
            setOnlineProgressList(progressList);
            setOnlineHelpRequests(helpList);
            setIsNotFound(false);
          }
          setIsLoadingOnline(false);
        })
        .catch((err) => {
          console.error("[ClassFlow] Firestore 대시보드 데이터 로드 오류:", err);
          setIsNotFound(true);
          setIsLoadingOnline(false);
        });
    } else {
      // 2. 세션이 없으면 기존 localStorage 모드 확인 (요구사항 #17, #41)
      setIsLoadingOnline(false);
      const currentData = getCurrentClassData();

      if (!currentData) {
        // 로컬스토리지에도 데이터가 없으면 접근 불가 안내 (요구사항 #41)
        setHasNoData(true);
        return;
      }

      setLocalData(currentData);
      const foundStudent = currentData.students.find((s) => s.id === studentId);
      if (!foundStudent) {
        setIsNotFound(true);
      } else {
        setLocalStudent(foundStudent);
        setIsNotFound(false);
      }
    }
  }, [studentId]);

  // 다른 강의 코드로 나가기
  const handleLeaveSession = () => {
    clearJoinedCourseSession();
    router.push("/join");
  };

  // 로딩 중 표시
  if (joinedSession && isLoadingOnline) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-sm">
        <div className="text-3xl mb-3 animate-spin">⏳</div>
        <span>강의 및 진행 상태를 불러오는 중입니다...</span>
      </div>
    );
  }

  // 본인이 아닌 다른 수강생 URL 접근 차단 (요구사항 #33, #34)
  if (isUnauthorized) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-amber-200 shadow-sm text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          접근 제한
        </h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          현재 입장하신 본인({joinedSession?.participantName || "수강생"})의 대시보드만 열람할 수 있습니다.
        </p>
        <Link
          href="/student"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← 수강생 선택으로 돌아가기
        </Link>
      </div>
    );
  }

  // 강의 데이터가 전혀 없는 경우 (요구사항 #41)
  if (hasNoData) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-4">🚪</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          입장한 강의가 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          강의 코드를 입력하여 강의에 먼저 입장해 주세요.
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

  // 참여자를 찾을 수 없는 경우 (요구사항 #41)
  if (isNotFound) {
    const roleParticipant = joinedSession
      ? joinedSession.roleLabels.participant
      : localData?.settings
      ? getRoleLabels(localData.settings).participant
      : "수강생";

    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {roleParticipant}을(를) 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          요청하신 {roleParticipant} ID (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">{studentId}</code>)는 존재하지 않습니다.
        </p>
        <Link
          href="/student"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← {roleParticipant} 선택으로 돌아가기
        </Link>
      </div>
    );
  }

  // ==========================================
  // [A] Firestore 온라인 입장 모드 렌더링
  // ==========================================
  if (joinedSession && onlineStudent) {
    const roleLabels: RoleLabels = joinedSession.roleLabels;

    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col">
        {/* 상단 내비게이션 바 */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            href="/student"
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            ← {roleLabels.participant} 다시 선택
          </Link>

          <button
            onClick={handleLeaveSession}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            🚪 강의 퇴장
          </button>
        </div>

        {/* 온라인 모드 안내 배너 */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs sm:text-sm leading-relaxed mb-6">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1">
            <span>🌐</span>
            <span>강의 코드로 입장한 온라인 강의입니다</span>
          </div>
          <p className="text-blue-800 text-xs">
            각 차시를 선택하여 진행 상태, 이해도 및 도움 요청을 전송할 수 있으며, 변경된 상태는 클라우드에 안전하게 보존됩니다.
          </p>
        </div>

        {/* 학생 프로필 헤더 카드 */}
        <header className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
            <span>ClassFlow</span>
            <span>•</span>
            <span className="truncate max-w-[280px] font-bold">
              {joinedSession.courseTitle}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              ({joinedSession.courseCode})
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            안녕하세요, <span className="text-blue-600">{onlineStudent.name}</span>님! 👋
          </h1>
          <p className="text-sm text-slate-500">
            오늘 진행할 과제를 확인하고 자신의 속도에 맞추어 학습해 보세요.
          </p>
        </header>

        {/* 나의 학습 차시 목록 섹션 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1 mb-1">
            <h2 className="text-base font-bold text-slate-800">
              나의 학습 ({onlineLessons.length}차시)
            </h2>
            <span className="text-xs text-slate-400">
              상태를 확인하고 수업에 참여하세요
            </span>
          </div>

          {/* 차시가 0개인 경우 안내 */}
          {onlineLessons.length === 0 ? (
            <div className="py-12 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs mb-2">
              <span className="text-3xl block mb-2">📚</span>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                등록된 차시가 없습니다
              </h3>
              <p className="text-xs text-slate-500">
                강사가 차시를 등록하면 이곳에 목록이 나타납니다.
              </p>
            </div>
          ) : (
            <>
              {/* 모든 차시가 비공개인 경우 안내 */}
              {onlineLessons.filter((l) => l.published).length === 0 && (
                <div className="py-10 px-6 text-center bg-white rounded-3xl border border-dashed border-amber-300 bg-amber-50/40 shadow-xs mb-2">
                  <span className="text-3xl block mb-2">🔒</span>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    현재 공개된 차시가 없습니다
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    선생님이 차시를 공개하면 이곳에서 과제를 확인하고 학습할 수 있습니다.
                  </p>
                </div>
              )}

              {/* 차시 카드 렌더링 (Firestore Progress 및 HelpRequest 상태 전달) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {onlineLessons.map((lesson) => {
                  const lessonProgress = onlineProgressList.find(
                    (p) => p.lessonId === lesson.id
                  );

                  const hasWaitingHelp = onlineHelpRequests.some(
                    (r) => r.lessonId === lesson.id && r.status === "waiting"
                  );

                  return (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      progress={lessonProgress}
                      studentId={onlineStudent.id}
                      hasWaitingHelpRequest={hasWaitingHelp}
                    />
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  // ==========================================
  // [B] 기존 localStorage 모드 렌더링 (보존)
  // ==========================================
  if (!localData || !localStudent) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        정보를 불러오는 중입니다...
      </div>
    );
  }

  const { settings, lessons, progress, helpRequests } = localData;
  const roleLabels = getRoleLabels(settings);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col">
      {/* 상단 내비게이션 바 */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/student"
          className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
        >
          ← {roleLabels.participant} 다시 선택
        </Link>

        <Link
          href="/teacher"
          className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
        >
          {roleLabels.instructor} 화면으로 이동 →
        </Link>
      </div>

      {/* 학생 프로필 헤더 카드 */}
      <header className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
          <span>ClassFlow</span>
          <span>•</span>
          <span className="truncate max-w-[280px]">{settings.className}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
          안녕하세요, <span className="text-blue-600">{localStudent.name}</span>님! 👋
        </h1>
        <p className="text-sm text-slate-500">
          오늘 진행할 과제를 확인하고 자신의 속도에 맞추어 학습해 보세요.
        </p>
      </header>

      {/* 나의 학습 차시 목록 섹션 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 mb-1">
          <h2 className="text-base font-bold text-slate-800">
            나의 학습 ({lessons.length}차시)
          </h2>
          <span className="text-xs text-slate-400">
            상태를 확인하고 수업에 참여하세요
          </span>
        </div>

        {lessons.filter((l) => l.published).length === 0 && (
          <div className="py-10 px-6 text-center bg-white rounded-3xl border border-dashed border-amber-300 bg-amber-50/40 shadow-xs mb-2">
            <span className="text-3xl block mb-2">🔒</span>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              현재 공개된 차시가 없습니다
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              선생님이 차시를 공개하면 이곳에서 과제를 확인하고 학습할 수 있습니다.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {lessons.map((lesson) => {
            const lessonProgress = progress.find(
              (p) => p.studentId === localStudent.id && p.lessonId === lesson.id
            );

            const hasWaitingHelp = helpRequests?.some(
              (r) =>
                r.studentId === localStudent.id &&
                r.lessonId === lesson.id &&
                r.status === "waiting"
            );

            return (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                progress={lessonProgress}
                studentId={localStudent.id}
                hasWaitingHelpRequest={hasWaitingHelp}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
