"use client";

import { useState } from "react";
import Link from "next/link";
import type { ClassSettings } from "@/types";

// 수업 설정 폼 컴포넌트
export default function ClassSetupForm() {
  // 1. 입력 폼 상태 관리
  const [className, setClassName] = useState<string>("AI와 피지컬 컴퓨팅");
  const [studentCount, setStudentCount] = useState<number | string>(20);
  const [lessonCount, setLessonCount] = useState<number | string>(10);

  // 2. 오류 메시지 상태 관리
  const [errors, setErrors] = useState<{
    className?: string;
    studentCount?: string;
    lessonCount?: string;
  }>({});

  // 3. STEP 1 제출 완료 결과 확인용 상태 (콘솔 출력 및 화면 안내)
  const [submittedSettings, setSubmittedSettings] = useState<ClassSettings | null>(null);

  // 입력값 검증 함수
  const validateForm = (): boolean => {
    const newErrors: {
      className?: string;
      studentCount?: string;
      lessonCount?: string;
    } = {};

    // 수업명 검증
    if (!className.trim()) {
      newErrors.className = "수업명을 입력해 주세요.";
    }

    // 학생 수 검증 (1 ~ 40)
    const parsedStudents = Number(studentCount);
    if (isNaN(parsedStudents) || !Number.isInteger(parsedStudents)) {
      newErrors.studentCount = "학생 수를 숫자로 정확히 입력해 주세요.";
    } else if (parsedStudents < 1 || parsedStudents > 40) {
      newErrors.studentCount = "학생 수는 1명에서 40명 사이로 입력해 주세요.";
    }

    // 차시 수 검증 (1 ~ 30)
    const parsedLessons = Number(lessonCount);
    if (isNaN(parsedLessons) || !Number.isInteger(parsedLessons)) {
      newErrors.lessonCount = "차시 수를 숫자로 정확히 입력해 주세요.";
    } else if (parsedLessons < 1 || parsedLessons > 30) {
      newErrors.lessonCount = "차시 수는 1차시에서 30차시 사이로 입력해 주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 처리 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 입력값 유효성 검증
    if (!validateForm()) {
      setSubmittedSettings(null);
      return;
    }

    const newSettings: ClassSettings = {
      className: className.trim(),
      studentCount: Number(studentCount),
      lessonCount: Number(lessonCount),
      createdAt: new Date().toISOString(),
    };

    // STEP 1 명세에 따라 Console에 입력값 출력
    console.log("[ClassFlow Setup - STEP 1] 입력된 수업 설정:", newSettings);

    // 사용자에게 성공 안내 표시
    setSubmittedSettings(newSettings);
  };

  return (
    <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
      {/* 상단 네비게이션 및 헤더 */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <Link
            href="/"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 mb-1"
          >
            ← 메인으로 돌아가기
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            수업 설정
          </h1>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          STEP 1
        </span>
      </div>

      <p className="text-sm text-slate-600 mb-8 leading-relaxed">
        진행할 수업의 기본 정보를 입력해 주세요. 입력한 학생 수와 차시에 맞춰 대시보드가 자동으로 구성됩니다.
      </p>

      {/* 설정 폼 영역 */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* 1. 수업명 입력 */}
        <div>
          <label
            htmlFor="className"
            className="block text-sm font-semibold text-slate-800 mb-2"
          >
            수업명 <span className="text-red-500">*</span>
          </label>
          <input
            id="className"
            type="text"
            value={className}
            onChange={(e) => {
              setClassName(e.target.value);
              if (errors.className) {
                setErrors((prev) => ({ ...prev, className: undefined }));
              }
            }}
            placeholder="예: AI와 피지컬 컴퓨팅"
            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
              errors.className
                ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {errors.className ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.className}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">
              수업 주제나 과목 이름을 자유롭게 적어주세요.
            </p>
          )}
        </div>

        {/* 2. 학생 수 입력 */}
        <div>
          <label
            htmlFor="studentCount"
            className="block text-sm font-semibold text-slate-800 mb-2"
          >
            학생 수 <span className="text-red-500">*</span>
            <span className="ml-1.5 text-xs font-normal text-slate-500">
              (1 ~ 40명)
            </span>
          </label>
          <input
            id="studentCount"
            type="number"
            min={1}
            max={40}
            value={studentCount}
            onChange={(e) => {
              setStudentCount(e.target.value);
              if (errors.studentCount) {
                setErrors((prev) => ({ ...prev, studentCount: undefined }));
              }
            }}
            placeholder="20"
            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
              errors.studentCount
                ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {errors.studentCount ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.studentCount}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">
              권장 범위: 1 ~ 40명
            </p>
          )}
        </div>

        {/* 3. 차시 수 입력 */}
        <div>
          <label
            htmlFor="lessonCount"
            className="block text-sm font-semibold text-slate-800 mb-2"
          >
            차시 수 <span className="text-red-500">*</span>
            <span className="ml-1.5 text-xs font-normal text-slate-500">
              (1 ~ 30차시)
            </span>
          </label>
          <input
            id="lessonCount"
            type="number"
            min={1}
            max={30}
            value={lessonCount}
            onChange={(e) => {
              setLessonCount(e.target.value);
              if (errors.lessonCount) {
                setErrors((prev) => ({ ...prev, lessonCount: undefined }));
              }
            }}
            placeholder="10"
            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
              errors.lessonCount
                ? "border-red-400 bg-red-50/30 focus:ring-red-400"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
          />
          {errors.lessonCount ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.lessonCount}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">
              권장 범위: 1 ~ 30차시
            </p>
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-6 py-4 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20"
          >
            수업 만들기
          </button>
        </div>
      </form>

      {/* STEP 1 완료 피드백 알림 (콘솔 출력 및 유효성 검증 성공 안내) */}
      {submittedSettings && (
        <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <span className="text-emerald-600">✓</span>
            입력값 검증 완료 (콘솔에 출력됨)
          </div>
          <div className="text-xs text-emerald-800 space-y-1">
            <p>• 수업명: <strong>{submittedSettings.className}</strong></p>
            <p>• 학생 수: <strong>{submittedSettings.studentCount}명</strong></p>
            <p>• 차시 수: <strong>{submittedSettings.lessonCount}차시</strong></p>
            <p className="pt-1.5 text-emerald-700 font-medium">
              ※ STEP 1 요구사항에 따라 현재 단계에서는 Console 출력까지 구현되었습니다. 다음 STEP 2에서 동적 데이터 생성이 연동됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
