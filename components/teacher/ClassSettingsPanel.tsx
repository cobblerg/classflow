"use client";

import { useState, useEffect } from "react";
import type { ClassSettings } from "@/types";
import { updateClassName } from "@/lib/tempStore";

interface ClassSettingsPanelProps {
  settings: ClassSettings;
  onSettingsUpdated: () => void;
}

// 교사용 학급 기본 설정 확인 및 학급명 수정 컴포넌트 (STEP 12)
export default function ClassSettingsPanel({
  settings,
  onSettingsUpdated,
}: ClassSettingsPanelProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [classNameInput, setClassNameInput] = useState<string>(settings.className);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setClassNameInput(settings.className);
  }, [settings.className]);

  // 학급명 수정 저장 핸들러
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = classNameInput.trim();
    if (!trimmed) {
      setErrorMsg("수업명을 입력해 주세요.");
      return;
    }

    const success = updateClassName(trimmed);
    if (success) {
      setIsEditing(false);
      setErrorMsg(null);
      setSuccessMsg("수업명이 성공적으로 변경되었습니다.");
      onSettingsUpdated();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            학급 기본 설정
          </h3>
        </div>

        {/* 저장 성공 토스트 */}
        {successMsg && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ✓ {successMsg}
          </span>
        )}
      </div>

      <div className="pt-3.5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* 1. 수업명 수정/조회 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between">
          <div className="mb-2">
            <span className="text-slate-400 font-semibold block mb-1">수업명</span>
            {isEditing ? (
              <form onSubmit={handleSave} className="flex items-center gap-2">
                <input
                  type="text"
                  value={classNameInput}
                  onChange={(e) => {
                    setClassNameInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 bg-white flex-1"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shrink-0"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setClassNameInput(settings.className);
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors shrink-0"
                >
                  취소
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-bold text-slate-900 truncate">
                  {settings.className}
                </strong>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-xs shrink-0 underline underline-offset-2"
                >
                  수정
                </button>
              </div>
            )}
            {errorMsg && (
              <p className="mt-1 text-[11px] font-semibold text-red-600">
                {errorMsg}
              </p>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            대시보드와 학생 화면에 노출되는 과목명입니다.
          </span>
        </div>

        {/* 2. 전체 학생 수 (조회용) */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <span className="text-slate-400 font-semibold block mb-1">전체 학생 수</span>
            <strong className="text-sm font-bold text-slate-900">
              {settings.studentCount}명
            </strong>
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            학생 수 변경은 [설정 변경]에서 새 수업으로 생성하세요.
          </span>
        </div>

        {/* 3. 전체 차시 수 (조회용) */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between">
          <div>
            <span className="text-slate-400 font-semibold block mb-1">전체 차시 수</span>
            <strong className="text-sm font-bold text-slate-900">
              {settings.lessonCount}개 차시
            </strong>
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            차시 수 변경은 [설정 변경]에서 새 수업으로 생성하세요.
          </span>
        </div>
      </div>
    </div>
  );
}
