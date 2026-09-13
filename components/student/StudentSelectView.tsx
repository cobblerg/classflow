"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentClassData, setCurrentClassData } from "@/lib/tempStore";
import { createClassData } from "@/lib/createClassData";
import { getRoleLabels, getJosa } from "@/lib/roleLabels";
import {
  getJoinedCourseSession,
  clearJoinedCourseSession,
  updateJoinedCourseParticipant,
  type JoinedCourseSession,
} from "@/lib/session";
import { getCourseParticipants } from "@/lib/firestore/participants";
import type { ClassFlowData, Student, RoleLabels } from "@/types";
import StudentSelector from "./StudentSelector";

// 학생/수강생 선택 메인 뷰 컴포넌트 (STEP 23: Firestore 세션 연동)
export default function StudentSelectView() {
  const router = useRouter();

  // 1. 온라인 강의 입장 세션 (JoinedCourseSession)
  const [joinedSession, setJoinedSession] = useState<JoinedCourseSession | null>(null);
  const [onlineStudents, setOnlineStudents] = useState<Student[]>([]);
  const [isLoadingOnline, setIsLoadingOnline] = useState<boolean>(true);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  // 2. 로컬 모드용 데이터 (localStorage)
  const [localData, setLocalData] = useState<ClassFlowData | null>(null);

  useEffect(() => {
    // 1. 세션스토리지에서 Firestore 입장 세션 확인 (요구사항 #23)
    const session = getJoinedCourseSession();

    if (session && session.courseId) {
      setJoinedSession(session);
      setIsLoadingOnline(true);

      // Firestore에서 수강생 명단 로드 (요구사항 #12)
      getCourseParticipants(session.courseId)
        .then((participants) => {
          setOnlineStudents(participants);
          setIsLoadingOnline(false);
        })
        .catch((err) => {
          console.error("[ClassFlow] Firestore participants 로드 실패:", err);
          setOnlineError("수강생 명단을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
          setIsLoadingOnline(false);
        });
    } else {
      // 2. 세션이 없으면 기존 localStorage 모드로 동작 (요구사항 #23, #30)
      setIsLoadingOnline(false);
      let currentData = getCurrentClassData();

      // 로컬 데이터도 없으면 기본값으로 자동 생성 (기존 UX 유지)
      if (!currentData) {
        currentData = createClassData({
          className: "AI와 피지컬 컴퓨팅",
          studentCount: 20,
          lessonCount: 10,
          createdAt: new Date().toISOString(),
        });
        setCurrentClassData(currentData);
      }

      setLocalData(currentData);
    }
  }, []);

  // 다른 강의 코드로 입장하기 (세션 클리어 후 /join 이동)
  const handleLeaveSession = () => {
    clearJoinedCourseSession();
    router.push("/join");
  };

  // 수강생 클릭 시 세션에 participantId 기록 (요구사항 #16)
  const handleSelectStudent = (student: Student) => {
    if (joinedSession) {
      updateJoinedCourseParticipant(student.id, student.name);
    }
  };

  // ==========================================
  // [A] Firestore 온라인 입장 모드 렌더링
  // ==========================================
  if (joinedSession) {
    const roleLabels: RoleLabels = joinedSession.roleLabels || {
      instructor: "강사",
      participant: "수강생",
    };

    if (isLoadingOnline) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-sm">
          <div className="text-3xl mb-3 animate-spin">⏳</div>
          <span>수강생 목록을 불러오는 중입니다...</span>
        </div>
      );
    }

    if (onlineError) {
      return (
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-rose-900 mb-2">오류 발생</h2>
          <p className="text-xs text-rose-700 mb-6">{onlineError}</p>
          <button
            onClick={handleLeaveSession}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            ← 강의 코드 다시 입력하기
          </button>
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col">
        {/* 상단 안내 헤더 */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                className="text-xl font-extrabold tracking-tight text-slate-900 hover:opacity-90"
              >
                Class<span className="text-blue-600">Flow</span>
              </Link>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                온라인 강의 입장 모드
              </span>
            </div>

            <button
              onClick={handleLeaveSession}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer text-left sm:text-right inline-flex items-center gap-1 w-fit"
            >
              🔑 다른 강의 코드로 입장
            </button>
          </div>

          {/* MVP 입장 방식 안내 배너 (요구사항 #15) */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed mb-4">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <span>⚠</span>
              <span>MVP 입장 방식 안내</span>
            </div>
            <p className="text-amber-800">
              실제 사용자 인증은 아직 적용되지 않았습니다. 본인의 이름({getJosa(roleLabels.participant, "을/를")})을 목록에서 선택해 주세요.
            </p>
          </div>

          {/* 현재 강의 정보 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              강의명: <strong className="text-slate-800 font-bold">{joinedSession.courseTitle}</strong>
              <span className="ml-2 font-mono text-slate-400">({joinedSession.courseCode})</span>
            </div>
            <div>
              전체 {roleLabels.participant}: <strong className="text-blue-600 font-bold">{onlineStudents.length}명</strong>
            </div>
          </div>
        </div>

        {/* 참여자 선택 그리드 또는 빈 화면 안내 (요구사항 #38) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          {onlineStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <span className="text-4xl block mb-2">📭</span>
              <p className="text-base font-bold text-slate-800 mb-1">
                등록된 {roleLabels.participant}이(가) 없습니다.
              </p>
              <p className="text-xs text-slate-400">
                강사에게 문의해 주세요.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                <span>👥</span>
                <span>
                  {getJosa(roleLabels.participant, "을/를")} 선택하세요 ({onlineStudents.length}명)
                </span>
              </h2>
              <StudentSelector
                students={onlineStudents}
                onSelect={handleSelectStudent}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // [B] 기존 localStorage 모드 렌더링 (보존)
  // ==========================================
  if (!localData) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        목록을 불러오는 중입니다...
      </div>
    );
  }

  const { settings, students } = localData;
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
              {roleLabels.participant} 화면 (로컬 모드)
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
