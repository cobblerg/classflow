"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  normalizeCourseCode,
  isValidCourseCodeFormat,
  COURSE_CODE_LENGTH,
} from "@/lib/courseCode";
import { findCourseByCode, type CourseDocument } from "@/lib/firestore/courses";
import { setJoinedCourseSession } from "@/lib/session";

// 수강생용 강의 코드 입력 및 입장 페이지 (/join, STEP 23 Firestore 연동)
export default function JoinPage() {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Firestore에서 찾은 강의 정보 (확인 화면용)
  const [foundCourse, setFoundCourse] = useState<CourseDocument | null>(null);

  // 강의 코드 검색 제출 처리 핸들러 (STEP 23)
  const handleSearchCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    // 중복 호출 방지 (요구사항 #10)
    if (isSearching) return;

    // 1. 입력값 정규화 (trim + toUpperCase, 요구사항 #4)
    const normalized = normalizeCourseCode(codeInput);

    // 2. 빈 값 검증 (요구사항 #5, #47)
    if (!normalized) {
      setErrorMessage("강의 코드를 입력해주세요.");
      return;
    }

    // 3. 코드 형식 검증 (6자리 영문+숫자 및 허용 문자 세트, 요구사항 #5, #47)
    if (!isValidCourseCodeFormat(normalized)) {
      setErrorMessage("올바른 6자리 강의 코드를 입력해주세요. (0, O, 1, I, L 제외)");
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      // 4. Firestore courses 컬렉션에서 단건 조회 (요구사항 #2, #3, #33)
      const course = await findCourseByCode(normalized);

      if (!course) {
        // 일치하는 강의가 없는 경우 (요구사항 #8, #46)
        setErrorMessage("해당 강의를 찾을 수 없습니다. 강의 코드를 다시 확인해 주세요.");
        setFoundCourse(null);
      } else {
        // 5. 강의 발견 -> 확인 카드 표시 (요구사항 #11)
        setFoundCourse(course);
        setErrorMessage(null);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[ClassFlow Join] Firestore 조회 오류:", message);

      // 중복 코드 에러인 경우 (요구사항 #32)
      if (message.includes("동일한 강의 코드")) {
        setErrorMessage(message);
      } else {
        // 네트워크 또는 Firestore 접근 오류 (요구사항 #9, #20)
        setErrorMessage("강의 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
      setFoundCourse(null);
    } finally {
      setIsSearching(false);
    }
  };

  // 찾은 강의로 최종 입장 처리 (요구사항 #11, #19, #20)
  const handleConfirmJoin = () => {
    if (!foundCourse) return;

    // JoinedCourseSession 생성 및 sessionStorage 저장 (요구사항 #19, #20)
    setJoinedCourseSession({
      courseId: foundCourse.courseId,
      courseCode: foundCourse.courseCode,
      courseTitle: foundCourse.title,
      studentCount: foundCourse.studentCount,
      lessonCount: foundCourse.lessonCount,
      roleLabels: foundCourse.roleLabels,
    });

    // 참여자 선택 화면으로 이동 (요구사항 #24)
    router.push("/student");
  };

  // 다른 코드 입력으로 초기화
  const handleResetSearch = () => {
    setFoundCourse(null);
    setErrorMessage(null);
    setCodeInput("");
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8 sm:p-10 text-center">
        {/* 상단 홈으로 돌아가기 링크 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
          >
            ← 메인으로
          </Link>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            수강생 입장
          </span>
        </div>

        {/* 1. 강의를 아직 찾기 전: 코드 입력 폼 */}
        {!foundCourse ? (
          <>
            {/* 아이콘 및 타이틀 */}
            <div className="text-4xl sm:text-5xl mb-3">🔑</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              강의 코드 입력
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              강사에게 안내받은 6자리 강의 코드를 입력하세요.
            </p>

            {/* 폼 영역 (Enter 키 지원 및 연타 방어) */}
            <form onSubmit={handleSearchCourse} className="space-y-4 text-left">
              <div>
                <label
                  htmlFor="course-code"
                  className="block text-xs font-bold text-slate-700 mb-2 text-center"
                >
                  강의 코드 (6자리)
                </label>

                <input
                  id="course-code"
                  type="text"
                  value={codeInput}
                  disabled={isSearching}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, COURSE_CODE_LENGTH);
                    setCodeInput(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="예: K7P4XR"
                  maxLength={COURSE_CODE_LENGTH}
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                  className="w-full text-center font-mono text-2xl sm:text-3xl font-black tracking-widest text-slate-900 px-4 py-3.5 sm:py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all uppercase bg-slate-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* 에러 메시지 */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5 animate-fadeIn"
                >
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 검색/입장 버튼 */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <span>[강의 찾는 중...]</span>
                ) : (
                  <>
                    <span>강의 찾기</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* 2. 강의 발견 후: 확인 화면 (요구사항 #11) */
          <div className="space-y-5 text-left animate-fadeIn">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                강의를 찾았습니다
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-3 mb-1">
                {foundCourse.title}
              </h2>
              <p className="text-xs font-mono text-slate-400">
                코드: {foundCourse.courseCode}
              </p>
            </div>

            {/* 강의 기본 정보 박스 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">역할 명칭</span>
                <span className="font-semibold text-slate-800">
                  {foundCourse.roleLabels.instructor} / {foundCourse.roleLabels.participant}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">
                  등록된 {foundCourse.roleLabels.participant}
                </span>
                <span className="font-bold text-blue-600">
                  {foundCourse.studentCount}명
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">전체 차시</span>
                <span className="font-bold text-slate-800">
                  {foundCourse.lessonCount}차시
                </span>
              </div>
            </div>

            {/* 입장하기 및 취소 버튼 */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmJoin}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <span>이 강의에 입장하기</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={handleResetSearch}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-center cursor-pointer"
              >
                다른 강의 코드 입력하기
              </button>
            </div>
          </div>
        )}

        {/* MVP 입장 방식 및 보안 안내 배너 (요구사항 #6, #15) */}
        <div className="mt-8 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-left">
          <div className="flex items-start gap-2">
            <span className="text-amber-700 text-sm mt-0.5">ℹ️</span>
            <div>
              <strong className="text-xs font-bold text-amber-900 block mb-0.5">
                MVP 입장 방식 안내
              </strong>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                강의 코드는 강의를 찾기 위한 식별 코드이며 보안 인증이 아닙니다.
                실제 사용자 로그인 및 보안 인증은 향후 단계에서 적용될 예정입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
