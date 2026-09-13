"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCurrentClassData,
  setCurrentClassData,
  updateProgressStatus,
  updateUnderstanding,
} from "@/lib/tempStore";
import { createClassData } from "@/lib/createClassData";
import type {
  ClassFlowData,
  Student,
  Lesson,
  Progress,
  ProgressStatus,
  Understanding,
} from "@/types";
import ProgressStatusSelector from "./ProgressStatusSelector";
import UnderstandingSelector from "./UnderstandingSelector";
import HelpRequestPanel from "./HelpRequestPanel";

interface LessonDetailProps {
  studentId: string; // 학생 고유 ID
  lessonId: string;  // 차시 고유 ID
}

// 학생 과제 상세 화면 컴포넌트
export default function LessonDetail({ studentId, lessonId }: LessonDetailProps) {
  const [data, setData] = useState<ClassFlowData | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [errorType, setErrorType] = useState<"student_not_found" | "lesson_not_found" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);



  useEffect(() => {
    // 1. 메모리 저장소에서 현재 수업 데이터 가져오기
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

    // 2. studentId로 학생 조회
    const foundStudent = currentData.students.find((s) => s.id === studentId);
    if (!foundStudent) {
      setErrorType("student_not_found");
      return;
    }
    setStudent(foundStudent);

    // 3. lessonId로 차시 조회
    const foundLesson = currentData.lessons.find((l) => l.id === lessonId);
    if (!foundLesson) {
      setErrorType("lesson_not_found");
      return;
    }
    setLesson(foundLesson);

    // 4. 학생 × 차시 진행 상태 조회
    const foundProgress = currentData.progress.find(
      (p) => p.studentId === foundStudent.id && p.lessonId === foundLesson.id
    );
    if (foundProgress) {
      setProgress(foundProgress);
    }
  }, [studentId, lessonId]);

  // 로딩 상태
  if (!data && !errorType) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        과제 정보를 불러오는 중입니다...
      </div>
    );
  }

  // 5. 예외 처리 A: 존재하지 않는 studentId (Test D)
  if (errorType === "student_not_found") {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          학생을 찾을 수 없습니다
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          요청하신 학생 ID (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">{studentId}</code>)는 존재하지 않습니다.
        </p>
        <Link
          href="/student"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
        >
          ← 학생 선택으로 돌아가기
        </Link>
      </div>
    );
  }

  // 6. 예외 처리 B: 존재하지 않는 lessonId (Test E)
  if (errorType === "lesson_not_found" || (!lesson && !student)) {
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

  // 7. 예외 처리 C: 비공개 차시 직접 URL 접근 차단 (Test C)
  if (lesson && !lesson.published) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          아직 공개되지 않은 차시입니다
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          선생님이 차시를 공개하면 과제를 확인하고 학습을 진행할 수 있습니다.
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

  if (!student || !lesson) return null;

  // 8. 학생 진행 상태 변경 핸들러 (STEP 6)
  const handleStatusChange = (newStatus: ProgressStatus) => {
    if (!student || !lesson) return;

    // lib/tempStore의 updateProgressStatus 호출하여 공유 메모리 데이터 갱신
    const updatedData = updateProgressStatus(student.id, lesson.id, newStatus);
    if (updatedData) {
      setData(updatedData);
      const updatedProgress = updatedData.progress.find(
        (p) => p.studentId === student.id && p.lessonId === lesson.id
      );
      if (updatedProgress) {
        setProgress(updatedProgress);
      }
    }

    const labelMap: Record<ProgressStatus, string> = {
      not_started: "시작 전",
      in_progress: "진행 중",
      completed: "완료",
    };

    setFeedbackMsg(`진행 상태가 '${labelMap[newStatus]}'(으)로 변경되었습니다.`);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2500);
  };

  // 9. 학생 이해도 변경 핸들러 (STEP 7: progress.status와 완전히 독립적으로 동작)
  const handleUnderstandingChange = (newUnderstanding: Understanding) => {
    if (!student || !lesson) return;

    // lib/tempStore의 updateUnderstanding 호출 (status는 그대로 보존됨)
    const updatedData = updateUnderstanding(student.id, lesson.id, newUnderstanding);
    if (updatedData) {
      setData(updatedData);
      const updatedProgress = updatedData.progress.find(
        (p) => p.studentId === student.id && p.lessonId === lesson.id
      );
      if (updatedProgress) {
        setProgress(updatedProgress);
      }
    }

    const labelMap: Record<string, string> = {
      understood: "이해했어요",
      difficult: "어려워요",
      need_help: "도움이 필요해요",
    };

    if (newUnderstanding) {
      setFeedbackMsg(`이해 상태가 '${labelMap[newUnderstanding]}'(으)로 변경되었습니다.`);
    } else {
      setFeedbackMsg("이해 상태 선택이 해제되었습니다.");
    }
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2500);
  };

  // 10. 현재 학생 × 차시의 대기 중인 도움 요청 조회 및 동기화 (STEP 9)
  const currentHelpRequest =
    data?.helpRequests?.find(
      (r) =>
        r.studentId === student.id &&
        r.lessonId === lesson.id &&
        r.status === "waiting"
    ) || null;

  const handleHelpRequestChange = () => {
    const latestData = getCurrentClassData();
    if (latestData) {
      setData(latestData);
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

      {/* 헤더: 수업명 및 차시 제목 */}
      <header className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
          <span>ClassFlow</span>
          <span>•</span>
          <span>{data?.settings.className}</span>
          <span>•</span>
          <span className="text-slate-600">{student.name}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {lesson.title}
        </h1>
      </header>

      {/* 🎯 학습 목표 카드 (Test F 빈 내용 대응) */}
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

      {/* 📋 오늘의 과제 카드 (Test F 빈 내용 대응) */}
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

      {/* 나의 진행 상태 변경 섹션 (STEP 6) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="text-xl">📌</span>
            <span>나의 진행 상태</span>
          </h2>
          <span className="text-xs text-slate-400">자유롭게 변경 가능</span>
        </div>

        {/* 3가지 상태 선택 버튼 컴포넌트 */}
        <ProgressStatusSelector
          currentStatus={progress?.status || "not_started"}
          onStatusChange={handleStatusChange}
        />
      </section>

      {/* 이해 상태 선택 섹션 (STEP 7: 진행 상태와 독립적으로 운영) */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="text-xl">💭</span>
            <span>이해 상태</span>
          </h2>
          <span className="text-xs text-slate-400">선택 취소 가능</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          지금 이 학습 내용을 얼마나 이해하고 있나요?
        </p>

        {/* 3가지 이해도 선택 버튼 컴포넌트 */}
        <UnderstandingSelector
          currentUnderstanding={progress?.understanding || null}
          onUnderstandingChange={handleUnderstandingChange}
        />

        {/* 상태 변경 성공 피드백 알림 토스트 */}
        {feedbackMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 animate-fadeIn">
            <span>✓</span>
            <span>{feedbackMsg}</span>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400 leading-relaxed">
          💡 이해 상태를 선택하면 선생님 대시보드에 즉시 반영되어 필요할 때 도움을 받을 수 있습니다.
        </p>
      </section>

      {/* 5. 선생님께 도움 요청 섹션 (STEP 9) */}
      <HelpRequestPanel
        studentId={student.id}
        lessonId={lesson.id}
        currentHelpRequest={currentHelpRequest}
        onHelpRequestChange={handleHelpRequestChange}
      />

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
