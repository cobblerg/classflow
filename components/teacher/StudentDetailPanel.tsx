"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getCurrentClassData,
  resolveHelpRequest as resolveLocalHelpRequest,
} from "@/lib/tempStore";
import {
  getCourseDocument,
  getCourseParticipants,
  getCourseLessons,
  getParticipantLessonProgress,
  getParticipantLessonHelpRequests,
  resolveHelpRequest as resolveFirestoreHelpRequest,
} from "@/lib/firestore";
import { getRoleLabels } from "@/lib/roleLabels";
import type {
  ClassFlowData,
  Student,
  Lesson,
  Progress,
  HelpRequest,
  Feedback,
  RoleLabels,
} from "@/types";
import FeedbackEditor from "./FeedbackEditor";

interface StudentDetailPanelProps {
  studentId: string;
  lessonId: string;
}

// 교사/강사용 참여자 상세 보기 메인 패널 컴포넌트 (STEP 11, STEP 26 Firestore 연동)
export default function StudentDetailPanel({
  studentId,
  lessonId,
}: StudentDetailPanelProps) {
  // 모드 상태: "loading" | "firestore" | "local" | "error"
  const [panelMode, setPanelMode] = useState<
    "loading" | "firestore" | "local" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 공통 뷰 상태
  const [courseName, setCourseName] = useState<string>("ClassFlow");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [roleLabels, setRoleLabels] = useState<RoleLabels>({
    instructor: "강사",
    participant: "수강생",
  });
  const [student, setStudent] = useState<Student | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progressItem, setProgressItem] = useState<Progress | null>(null);
  const [relatedHelpRequests, setRelatedHelpRequests] = useState<HelpRequest[]>([]);

  // 로컬 모드 전용 상태
  const [localData, setLocalData] = useState<ClassFlowData | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null);
  const [submissionContent, setSubmissionContent] = useState<string | null>(null);

  // 데이터 로드 함수 (STEP 26)
  const loadDetailData = useCallback(async () => {
    try {
      const stored = getCurrentClassData();
      const currentCourseId = stored?.settings?.courseId;

      if (currentCourseId) {
        // 1. Firestore 모드 확인 (요구사항 #35)
        const courseDoc = await getCourseDocument(currentCourseId);
        if (courseDoc) {
          setCourseId(currentCourseId);
          setCourseName(courseDoc.title);
          const labels = getRoleLabels({ roleLabels: courseDoc.roleLabels });
          setRoleLabels(labels);

          // 수강생, 차시, 진행도, 도움 요청 병렬 조회
          const [participants, lessons, progress, helpList] =
            await Promise.all([
              getCourseParticipants(currentCourseId),
              getCourseLessons(currentCourseId),
              getParticipantLessonProgress(
                currentCourseId,
                studentId,
                lessonId
              ),
              getParticipantLessonHelpRequests(
                currentCourseId,
                studentId,
                lessonId
              ),
            ]);

          const foundStudent = participants.find((s) => s.id === studentId) || null;
          const foundLesson = lessons.find((l) => l.id === lessonId) || null;

          setStudent(foundStudent);
          setLesson(foundLesson);
          setProgressItem(progress);
          setRelatedHelpRequests(helpList);
          setPanelMode("firestore");
          return;
        }
      }

      // 2. 로컬 모드 (기존 tempStore 기반)
      if (stored) {
        setLocalData(stored);
        setCourseName(stored.settings.className);
        const labels = getRoleLabels(stored.settings);
        setRoleLabels(labels);

        const foundStudent = stored.students.find((s) => s.id === studentId) || null;
        const foundLesson = stored.lessons.find((l) => l.id === lessonId) || null;
        const foundProgress =
          stored.progress.find(
            (p) => p.studentId === studentId && p.lessonId === lessonId
          ) || null;

        const helpList = (stored.helpRequests || [])
          .filter((r) => r.studentId === studentId && r.lessonId === lessonId)
          .sort(
            (a, b) =>
              new Date(b.requestedAt).getTime() -
              new Date(a.requestedAt).getTime()
          );

        const fb =
          (stored.feedback || []).find(
            (f) => f.studentId === studentId && f.lessonId === lessonId
          ) || null;

        const sub = (stored.submissions || []).find(
          (s) => s.studentId === studentId && s.lessonId === lessonId
        );

        setStudent(foundStudent);
        setLesson(foundLesson);
        setProgressItem(foundProgress);
        setRelatedHelpRequests(helpList);
        setExistingFeedback(fb);
        setSubmissionContent(sub?.content || null);
        setPanelMode("local");
      } else {
        setErrorMessage("수업 데이터를 찾을 수 없습니다.");
        setPanelMode("error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ClassFlow] StudentDetailPanel load error:", msg);
      setErrorMessage(`상세 데이터를 불러오지 못했습니다: ${msg}`);
      setPanelMode("error");
    }
  }, [studentId, lessonId]);

  useEffect(() => {
    loadDetailData();
  }, [loadDetailData]);

  // 도움 완료 처리 핸들러 (STEP 26, 요구사항 #37)
  const handleResolve = async (helpRequestId: string) => {
    if (panelMode === "firestore" && courseId) {
      try {
        await resolveFirestoreHelpRequest(courseId, helpRequestId);
        // 상태 즉시 다시 읽기
        await loadDetailData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`도움 완료 처리 실패: ${msg}`);
      }
    } else {
      const success = resolveLocalHelpRequest(helpRequestId);
      if (success) {
        await loadDetailData();
      }
    }
  };

  // 로컬 모드 피드백 저장 완료 시 새로고침
  const handleFeedbackSaved = () => {
    loadDetailData();
  };

  // 시간 포맷터
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (panelMode === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  if (panelMode === "error" || errorMessage) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          오류가 발생했습니다
        </h2>
        <p className="text-sm text-slate-600 mb-6">{errorMessage}</p>
        <Link
          href="/teacher"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  // 예외 처리: 존재하지 않는 수강생
  if (!student) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {roleLabels.participant}을(를) 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          요청하신 {roleLabels.participant} ID (
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
            {studentId}
          </code>
          )는 존재하지 않습니다.
        </p>
        <Link
          href="/teacher"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← {roleLabels.instructor} 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  // 예외 처리: 존재하지 않는 차시
  if (!lesson) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          차시를 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          요청하신 차시 ID (
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
            {lessonId}
          </code>
          )는 존재하지 않습니다.
        </p>
        <Link
          href="/teacher"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← {roleLabels.instructor} 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  const latestHelpRequest = relatedHelpRequests[0] || null;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col pb-12">
      {/* 1. 상단 네비게이션 */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/teacher"
          className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
        >
          ← {roleLabels.instructor} 대시보드로 돌아가기
        </Link>

        {panelMode === "firestore" && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            ● 온라인 실시간 강의
          </span>
        )}
      </div>

      {/* 2. 헤더: 참여자 및 차시 정보 카드 */}
      <header className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <span>ClassFlow</span>
            <span>•</span>
            <span>{courseName}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            {roleLabels.instructor}용 {roleLabels.participant} 상세 보기
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {student.name}{" "}
          <span className="text-slate-400 font-normal text-xl">
            ({student.number}번)
          </span>
        </h1>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            {lesson.number}차시
          </span>
          <span className="font-bold text-slate-800">{lesson.title}</span>
        </div>

        {/* 비공개 차시 안내 배너 */}
        {!lesson.published && (
          <div className="mt-4 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <span>🔒</span>
            <span>
              현재 {roleLabels.participant}에게 비공개인 차시입니다. ({roleLabels.instructor} 관리 목적으로 조회 중)
            </span>
          </div>
        )}
      </header>

      {/* 3. 학습 상태 요약 (Progress & Understanding 분리 표시, 조회 전용) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-5">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span>학습 상태 요약</span>
          <span className="text-xs font-normal text-slate-400">
            ({roleLabels.participant} 자가 입력값)
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 진행 상태 (Progress) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">
              진행 상태 (과제 완성도)
            </span>
            <div className="flex items-center gap-2 mt-1">
              {progressItem?.status === "completed" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span>🟢</span> 완료
                </span>
              ) : progressItem?.status === "in_progress" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <span>🟡</span> 진행 중
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
                  <span>⚪</span> 시작 전
                </span>
              )}
            </div>
          </div>

          {/* 이해 상태 (Understanding) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">
              이해 상태 (개념 체감 난이도)
            </span>
            <div className="flex items-center gap-2 mt-1">
              {progressItem?.understanding === "understood" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span>😊</span> 이해했어요
                </span>
              ) : progressItem?.understanding === "difficult" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  <span>🤔</span> 어려워요
                </span>
              ) : progressItem?.understanding === "need_help" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <span>🆘</span> 도움이 필요해요
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                  <span>💭</span> 아직 선택하지 않음
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. 도움 요청(Help Request) 섹션 */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="text-xl">🙋</span>
            <span>도움 요청 내역</span>
          </h2>
          {latestHelpRequest && (
            <span className="text-xs text-slate-400">
              최근 요청: {formatTime(latestHelpRequest.requestedAt)}
            </span>
          )}
        </div>

        {!latestHelpRequest ? (
          <p className="text-xs sm:text-sm text-slate-400 italic py-2">
            이 차시에 접수된 도움 요청이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* 최근 요청 상세 카드 */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border ${
                latestHelpRequest.status === "waiting"
                  ? "bg-amber-50/60 border-amber-200"
                  : latestHelpRequest.status === "resolved"
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {latestHelpRequest.status === "waiting" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      <span>🙋</span> 도움 요청 대기 중
                    </span>
                  ) : latestHelpRequest.status === "resolved" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span>✅</span> 도움 요청 처리 완료
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                      <span>✕</span> 취소된 도움 요청
                    </span>
                  )}
                </div>

                {/* 대기 중인 경우 [도움 완료] 액션 버튼 (요구사항 #37) */}
                {latestHelpRequest.status === "waiting" && (
                  <button
                    type="button"
                    onClick={() => handleResolve(latestHelpRequest.id)}
                    className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm"
                  >
                    ✓ 도움 완료
                  </button>
                )}
              </div>

              {/* 요청 메시지 내용 */}
              <div className="bg-white/90 p-3 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-800 mb-2">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  요청 내용:
                </span>
                <p>{latestHelpRequest.message || "도움이 필요합니다."}</p>
              </div>

              {/* 요청 시각 및 처리 시각 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>
                  요청 시각: {formatTime(latestHelpRequest.requestedAt)}
                </span>
                {latestHelpRequest.resolvedAt && (
                  <span>
                    처리 시각: {formatTime(latestHelpRequest.resolvedAt)}
                  </span>
                )}
              </div>
            </div>

            {/* 과거 이력이 여러 개인 경우 간단한 이력 목록 */}
            {relatedHelpRequests.length > 1 && (
              <div className="mt-1 pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500 block mb-1.5">
                  이전 요청 기록 ({relatedHelpRequests.length - 1}건)
                </span>
                <ul className="space-y-1 text-xs text-slate-500">
                  {relatedHelpRequests.slice(1).map((hist) => (
                    <li key={hist.id} className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">
                        {formatTime(hist.requestedAt)}
                      </span>
                      <span>
                        {hist.status === "resolved"
                          ? "✅ 완료"
                          : hist.status === "cancelled"
                          ? "✕ 취소"
                          : "대기"}
                      </span>
                      <span className="text-slate-400 truncate max-w-[200px]">
                        &ldquo;{hist.message}&rdquo;
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. 참여자 결과물(Submission) 섹션 */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-5">
        <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <span className="text-xl">📄</span>
          <span>{roleLabels.participant} 결과물</span>
        </h2>
        {panelMode === "firestore" ? (
          <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
            온라인 강의의 결과물 제출/확인 기능은 다음 단계에서 지원될 예정입니다.
          </div>
        ) : submissionContent ? (
          <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
            {submissionContent}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-400 italic py-2">
            아직 제출된 결과물이 없습니다.
          </p>
        )}
      </section>

      {/* 6. 피드백 섹션 (요구사항 #36: Firestore mode 범위 제한) */}
      {panelMode === "firestore" ? (
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="text-xl">💬</span>
            <span>{roleLabels.instructor} 피드백</span>
          </h2>
          <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
            온라인 강의 피드백 작성 및 전송 기능은 다음 단계에서 지원될 예정입니다.
          </div>
        </section>
      ) : (
        <FeedbackEditor
          studentId={student.id}
          lessonId={lesson.id}
          existingFeedback={existingFeedback}
          onFeedbackSaved={handleFeedbackSaved}
          roleLabels={roleLabels}
        />
      )}
    </div>
  );
}

