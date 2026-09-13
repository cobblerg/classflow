"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentClassData, setCurrentClassData } from "@/lib/tempStore";
import { createClassData } from "@/lib/createClassData";
import type { ClassFlowData } from "@/types";

// STEP 2 동적 생성 데이터 확인 컴포넌트
export default function ClassDataPreview() {
  const [data, setData] = useState<ClassFlowData | null>(null);

  useEffect(() => {
    // 1. 메모리 스토어에서 현재 수업 데이터 가져오기
    let current = getCurrentClassData();

    // 2. 만약 직접 /teacher로 접속하여 데이터가 없다면 기본값(20명, 10차시)으로 자동 생성해 배려
    if (!current) {
      current = createClassData({
        className: "AI와 피지컬 컴퓨팅",
        studentCount: 20,
        lessonCount: 10,
        createdAt: new Date().toISOString(),
      });
      setCurrentClassData(current);
    }

    setData(current);
  }, []);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-500 text-sm">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  const { settings, students, lessons, progress } = data;

  return (
    <div className="w-full max-w-3xl bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
      {/* 상단 네비게이션 및 STEP 2 헤더 */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <Link
            href="/setup"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 mb-1"
          >
            ← 수업 설정으로 돌아가기
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            수업 데이터 생성 결과
          </h1>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          STEP 2 완료
        </span>
      </div>

      {/* 안내 메시지 */}
      <div className="mb-8 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 text-sm">
        <p className="font-semibold mb-1">
          💡 입력한 설정값에 따라 데이터가 정상적으로 동적 생성되었습니다!
        </p>
        <p className="text-xs text-blue-700">
          현재는 <strong>STEP 2 (데이터 동적 생성 검증)</strong> 단계입니다. 실제 Teacher Dashboard Grid는 다음 STEP 3에서 연결됩니다.
        </p>
      </div>

      {/* 1. 수업 기본 정보 및 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            수업명
          </span>
          <p className="text-base font-bold text-slate-800 truncate" title={settings.className}>
            {settings.className}
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            학생 수 / 차시 수
          </span>
          <p className="text-base font-bold text-slate-800">
            {settings.studentCount}명 · {settings.lessonCount}차시
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium block mb-1">
            초기 Progress 데이터
          </span>
          <p className="text-base font-bold text-indigo-600">
            총 {progress.length}개 생성
          </p>
        </div>
      </div>

      {/* 2. 학생 및 차시 데이터 예시 영역 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* 학생 목록 예시 */}
        <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/70">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">
              학생 예시 (총 {students.length}명)
            </h2>
            <span className="text-[11px] text-slate-400">앞 5명 표시</span>
          </div>
          <ul className="space-y-2">
            {students.slice(0, 5).map((student) => (
              <li
                key={student.id}
                className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-slate-100 text-slate-700"
              >
                <span className="font-semibold text-slate-900">
                  {String(student.number).padStart(2, "0")} {student.name}
                </span>
                <span className="text-slate-400 font-mono text-[10px]">
                  id: {student.id}
                </span>
              </li>
            ))}
            {students.length > 5 && (
              <li className="text-[11px] text-slate-400 text-center py-1">
                ... 외 {students.length - 5}명 생성됨
              </li>
            )}
          </ul>
        </div>

        {/* 차시 목록 예시 */}
        <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/70">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">
              차시 예시 (총 {lessons.length}차시)
            </h2>
            <span className="text-[11px] text-slate-400">앞 5개 표시</span>
          </div>
          <ul className="space-y-2">
            {lessons.slice(0, 5).map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-slate-100 text-slate-700"
              >
                <span className="font-semibold text-slate-900">
                  {lesson.title}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    lesson.published
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {lesson.published ? "🔓 공개됨" : "🔒 비공개"}
                </span>
              </li>
            ))}
            {lessons.length > 5 && (
              <li className="text-[11px] text-slate-400 text-center py-1">
                ... 외 {lessons.length - 5}차시 생성됨
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* 3. Progress 데이터 샘플 확인 영역 */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/70 mb-8">
        <h2 className="text-sm font-bold text-slate-800 mb-2">
          초기 Progress 조합 규칙 검증
        </h2>
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          모든 학생({students.length}명)과 차시({lessons.length}차시)의 곱인 총{" "}
          <strong>{progress.length}개</strong>의 진행도 데이터가 생성되었으며, 초기 상태는 모두{" "}
          <code className="bg-white px-1.5 py-0.5 rounded border text-indigo-600 font-mono">
            status: &quot;not_started&quot;
          </code>
          ,{" "}
          <code className="bg-white px-1.5 py-0.5 rounded border text-indigo-600 font-mono">
            understanding: null
          </code>
          로 세팅되었습니다.
        </p>
        <div className="bg-white p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 font-mono overflow-x-auto">
          {`// 첫 번째 Progress 샘플: `}
          {JSON.stringify(progress[0], null, 2)}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/setup"
          className="flex-1 inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] transition-all"
        >
          다른 조건으로 다시 만들기
        </Link>
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all"
        >
          홈으로 가기
        </Link>
      </div>
    </div>
  );
}
