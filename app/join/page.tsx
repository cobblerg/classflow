"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentClassData } from "@/lib/tempStore";
import { normalizeCourseCode, isValidCourseCodeFormat, COURSE_CODE_LENGTH } from "@/lib/courseCode";

// 수강생용 강의 코드 입력 및 입장 페이지 (/join, STEP 17)
export default function JoinPage() {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 강의 코드 제출 처리 핸들러
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 입력값 정규화 (앞뒤 공백 제거 + 대문자 변환, 요구사항 #18)
    const normalized = normalizeCourseCode(codeInput);

    // 2. 빈 값 검증 (요구사항 #20)
    if (!normalized) {
      setErrorMessage("강의 코드를 입력해주세요.");
      return;
    }

    // 3. 코드 형식 검증 (6자리 영문+숫자 및 허용 문자 세트, 요구사항 #19)
    if (!isValidCourseCodeFormat(normalized)) {
      setErrorMessage("올바른 강의 코드를 입력해주세요.");
      return;
    }

    // 4. localStorage에 저장된 현재 강의 데이터 확인 (요구사항 #21)
    const currentData = getCurrentClassData();
    if (!currentData || !currentData.settings) {
      setErrorMessage("현재 브라우저에 개설된 강의가 없습니다. 먼저 강의를 만들어주세요.");
      return;
    }

    const savedCode = normalizeCourseCode(currentData.settings.courseCode || "");

    // 5. 강의 코드 일치 여부 대조
    if (savedCode !== normalized) {
      setErrorMessage("해당 강의를 찾을 수 없습니다.");
      return;
    }

    // 6. 성공 시 참여자 선택 화면(/student)으로 이동 (요구사항 #22)
    setErrorMessage(null);
    router.push("/student");
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

        {/* 아이콘 및 타이틀 */}
        <div className="text-4xl sm:text-5xl mb-3">🔑</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          강의 코드 입력
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          강사에게 안내받은 6자리 강의 코드를 입력하세요.
        </p>

        {/* 폼 영역 (Enter 키 지원, 요구사항 #35) */}
        <form onSubmit={handleJoin} className="space-y-4 text-left">
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
              onChange={(e) => {
                // 최대 6자리까지 입력 허용 (소문자는 자동 대문자 변환 안내)
                const val = e.target.value.slice(0, COURSE_CODE_LENGTH);
                setCodeInput(val);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="예: K7P4XR"
              maxLength={COURSE_CODE_LENGTH}
              autoFocus
              autoComplete="off"
              spellCheck="false"
              className="w-full text-center font-mono text-2xl sm:text-3xl font-black tracking-widest text-slate-900 px-4 py-3.5 sm:py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all uppercase bg-slate-50/50"
            />
          </div>

          {/* 에러 메시지 (텍스트 및 아이콘 제공, 요구사항 #34) */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5 animate-fadeIn"
            >
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 입장하기 버튼 (태블릿 터치 친화적 대형 버튼, 요구사항 #33) */}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <span>입장하기</span>
            <span>→</span>
          </button>
        </form>

        {/* MVP 테스트 모드 한계 안내 배너 (요구사항 #2, #37) */}
        <div className="mt-8 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-left">
          <div className="flex items-start gap-2">
            <span className="text-amber-700 text-sm mt-0.5">ℹ️</span>
            <div>
              <strong className="text-xs font-bold text-amber-900 block mb-0.5">
                MVP 테스트 모드 안내
              </strong>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                현재 강의 코드는 이 브라우저에 저장된 강의에 대해서만 작동합니다.
                실제 여러 기기 간 실시간 입장은 향후 서버(Supabase) 연동 단계에서 지원됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
