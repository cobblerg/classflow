"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentClassData, setCurrentClassData } from "@/lib/tempStore";
import { createClassData } from "@/lib/createClassData";
import type { ClassFlowData, Student } from "@/types";
import LessonCard from "./LessonCard";

interface StudentDashboardProps {
  studentId: string; // URL 경로에서 전달받은 학생 ID
}

// 개별 학생용 대시보드 컴포넌트
export default function StudentDashboard({ studentId }: StudentDashboardProps) {
  const [data, setData] = useState<ClassFlowData | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

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

    // 2. studentId와 일치하는 학생 찾기
    const foundStudent = currentData.students.find((s) => s.id === studentId);
    if (!foundStudent) {
      setIsNotFound(true);
    } else {
      setStudent(foundStudent);
      setIsNotFound(false);
    }
  }, [studentId]);

  // 로딩 상태
  if (!data && !isNotFound) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-sm">
        학생 정보를 불러오는 중입니다...
      </div>
    );
  }

  // 3. 잘못된 studentId 예외 처리 화면 (Test E)
  if (isNotFound || !student) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="text-4xl mb-4">🔍</div>
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

  const { settings, lessons, progress } = data!;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col">
      {/* 4. 상단 내비게이션 바 */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/student"
          className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
        >
          ← 학생 다시 선택
        </Link>

        <Link
          href="/teacher"
          className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
        >
          교사 화면으로 이동 →
        </Link>
      </div>

      {/* 5. 학생 프로필 헤더 카드 */}
      <header className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
          <span>ClassFlow</span>
          <span>•</span>
          <span>{settings.className}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
          안녕하세요, <span className="text-blue-600">{student.name}</span>님! 👋
        </h1>
        <p className="text-sm text-slate-500">
          오늘 진행할 과제를 확인하고 자신의 속도에 맞추어 학습해 보세요.
        </p>
      </header>

      {/* 6. 나의 학습 차시 목록 섹션 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 mb-1">
          <h2 className="text-base font-bold text-slate-800">
            나의 학습 ({lessons.length}차시)
          </h2>
          <span className="text-xs text-slate-400">
            상태를 확인하고 수업에 참여하세요
          </span>
        </div>

        {/* 차시 카드 렌더링 */}
        {lessons.map((lesson) => {
          // 해당 학생과 차시에 해당하는 진행 상태 매칭
          const lessonProgress = progress.find(
            (p) => p.studentId === student.id && p.lessonId === lesson.id
          );

          return (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progress={lessonProgress}
              studentId={student.id}
            />
          );
        })}
      </section>
    </div>
  );
}
