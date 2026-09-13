"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getCurrentClassData,
  resolveHelpRequest,
} from "@/lib/tempStore";
import { getRoleLabels } from "@/lib/roleLabels";
import type {
  ClassFlowData,
  Student,
  Lesson,
  Progress,
  HelpRequest,
  Feedback,
} from "@/types";
import FeedbackEditor from "./FeedbackEditor";

interface StudentDetailPanelProps {
  studentId: string;
  lessonId: string;
}

// 교사/강사용 참여자 상세 보기 메인 패널 컴포넌트 (STEP 11, STEP 16 범용화)
export default function StudentDetailPanel({
  studentId,
  lessonId,
}: StudentDetailPanelProps) {
  const [data, setData] = useState<ClassFlowData | null>(null);

  useEffect(() => {
    const currentData = getCurrentClassData();
    setData(currentData);
  }, [studentId, lessonId]);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  const roleLabels = getRoleLabels(data.settings);

  // 1. 학생 및 차시 검색
  const student: Student | undefined = data.students.find((s) => s.id === studentId);
  const lesson: Lesson | undefined = data.lessons.find((l) => l.id === lessonId);

  // 예외 처리: 존재하지 않는 학생 (Test J)
  if (!student) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {roleLabels.participant}을(를) 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          요청하신 {roleLabels.participant} ID (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{studentId}</code>)는 존재하지 않습니다.
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

  // 예외 처리: 존재하지 않는 차시 (Test J)
  if (!lesson) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          차시를 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          요청하신 차시 ID (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{lessonId}</code>)는 존재하지 않습니다.
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

  // 2. 해당 학생 × 차시의 데이터 추출
  const progressItem: Progress | undefined = data.progress.find(
    (p) => p.studentId === student.id && p.lessonId === lesson.id
  );

  // 도움 요청 이력 (가장 최근 순)
  const relatedHelpRequests: HelpRequest[] = (data.helpRequests || [])
    .filter((r) => r.studentId === student.id && r.lessonId === lesson.id)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const latestHelpRequest = relatedHelpRequests[0] || null;

  // 교사 피드백
  const existingFeedback: Feedback | null =
    (data.feedback || []).find(
      (f) => f.studentId === student.id && f.lessonId === lesson.id
    ) || null;

  // 학생 결과물 (Submission, 조회 전용)
  const submission = (data.submissions || []).find(
    (s) => s.studentId === student.id && s.lessonId === lesson.id
  );

  // 도움 완료 처리 핸들러 (STEP 10 함수 재사용)
  const handleResolve = (helpRequestId: string) => {
    const success = resolveHelpRequest(helpRequestId);
    if (success) {
      const updated = getCurrentClassData();
      if (updated) setData(updated);
    }
  };

  // 피드백 저장 완료 시 데이터 새로고침
  const handleFeedbackSaved = () => {
    const updated = getCurrentClassData();
    if (updated) setData(updated);
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
      </div>

      {/* 2. 헤더: 참여자 및 차시 정보 카드 */}
      <header className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <span>ClassFlow</span>
            <span>•</span>
            <span>{data.settings.className}</span>
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

        {/* 비공개 차시 안내 배너 (요구사항 24번) */}
        {!lesson.published && (
          <div className="mt-4 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <span>🔒</span>
            <span>현재 {roleLabels.participant}에게 비공개인 차시입니다. ({roleLabels.instructor} 관리 목적으로 조회 중)</span>
          </div>
        )}
      </header>

      {/* 3. 학습 상태 요약 (Progress & Understanding 분리 표시, 조회 전용) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-5">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span>학습 상태 요약</span>
          <span className="text-xs font-normal text-slate-400">({roleLabels.participant} 자가 입력값)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 진행 상태 (Progress) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">진행 상태 (과제 완성도)</span>
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
            <span className="text-xs font-semibold text-slate-500">이해 상태 (개념 체감 난이도)</span>
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

                {/* 대기 중인 경우 [도움 완료] 액션 버튼 (요구사항 11번) */}
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
                <span className="font-semibold text-slate-900 block mb-0.5">요청 내용:</span>
                <p>{latestHelpRequest.message || "도움이 필요합니다."}</p>
              </div>

              {/* 요청 시각 및 처리 시각 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>요청 시각: {formatTime(latestHelpRequest.requestedAt)}</span>
                {latestHelpRequest.resolvedAt && (
                  <span>처리 시각: {formatTime(latestHelpRequest.resolvedAt)}</span>
                )}
              </div>
            </div>

            {/* 과거 이력이 여러 개인 경우 간단한 이력 목록 (요구사항 10번) */}
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

      {/* 5. 참여자 결과물(Submission) 섹션 (조회 전용) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-5">
        <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <span className="text-xl">📄</span>
          <span>{roleLabels.participant} 결과물</span>
        </h2>
        {submission?.content ? (
          <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
            {submission.content}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-400 italic py-2">
            아직 제출된 결과물이 없습니다.
          </p>
        )}
      </section>

      {/* 6. 피드백 섹션 (STEP 11, STEP 16 범용화) */}
      <FeedbackEditor
        studentId={student.id}
        lessonId={lesson.id}
        existingFeedback={existingFeedback}
        onFeedbackSaved={handleFeedbackSaved}
        roleLabels={roleLabels}
      />
    </div>
  );
}
