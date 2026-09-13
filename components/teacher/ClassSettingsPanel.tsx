"use client";

import { useState, useEffect } from "react";
import type { ClassSettings } from "@/types";
import { updateClassSettings } from "@/lib/tempStore";
import { getRoleLabels } from "@/lib/roleLabels";

interface ClassSettingsPanelProps {
  settings: ClassSettings;
  onSettingsUpdated: () => void;
}

// 교사/강사용 강의 기본 설정 확인 및 강의명/역할명칭 수정 컴포넌트 (STEP 12, STEP 16 확장)
export default function ClassSettingsPanel({
  settings,
  onSettingsUpdated,
}: ClassSettingsPanelProps) {
  const roleLabels = getRoleLabels(settings);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [classNameInput, setClassNameInput] = useState<string>(settings.className);
  const [instructorInput, setInstructorInput] = useState<string>(roleLabels.instructor);
  const [participantInput, setParticipantInput] = useState<string>(roleLabels.participant);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setClassNameInput(settings.className);
    setInstructorInput(roleLabels.instructor);
    setParticipantInput(roleLabels.participant);
  }, [settings.className, roleLabels.instructor, roleLabels.participant]);

  // 강의명 및 역할 명칭 수정 저장 핸들러
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedClassName = classNameInput.trim();
    const trimmedInstructor = instructorInput.trim();
    const trimmedParticipant = participantInput.trim();

    if (!trimmedClassName) {
      setErrorMsg("강의명을 입력해 주세요.");
      return;
    }
    if (!trimmedInstructor) {
      setErrorMsg("지도자(강사/교사) 명칭을 입력해 주세요.");
      return;
    }
    if (!trimmedParticipant) {
      setErrorMsg("참여자(수강생/학생) 명칭을 입력해 주세요.");
      return;
    }

    const success = updateClassSettings(trimmedClassName, {
      instructor: trimmedInstructor,
      participant: trimmedParticipant,
    });

    if (success) {
      setIsEditing(false);
      setErrorMsg(null);
      setSuccessMsg("강의 설정이 성공적으로 변경되었습니다.");
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
            강의 기본 설정
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
        {/* 1. 강의명 및 역할 명칭 수정/조회 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between md:col-span-2">
          <div className="mb-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-slate-400 font-semibold block">강의 정보 및 역할 명칭</span>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-xs shrink-0 underline underline-offset-2 cursor-pointer"
                >
                  수정
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    강의명
                  </label>
                  <input
                    type="text"
                    value={classNameInput}
                    onChange={(e) => {
                      setClassNameInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 bg-white"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      지도자 명칭 (예: 강사, 교사)
                    </label>
                    <input
                      type="text"
                      value={instructorInput}
                      onChange={(e) => {
                        setInstructorInput(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      참여자 명칭 (예: 수강생, 학생)
                    </label>
                    <input
                      type="text"
                      value={participantInput}
                      onChange={(e) => {
                        setParticipantInput(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-[11px] font-semibold text-red-600">
                    {errorMsg}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setClassNameInput(settings.className);
                      setInstructorInput(roleLabels.instructor);
                      setParticipantInput(roleLabels.participant);
                      setErrorMsg(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">강의명:</span>
                  <strong className="text-sm font-bold text-slate-900 truncate">
                    {settings.className}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">강의 코드:</span>
                  <code className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-mono font-bold tracking-wider text-xs select-all">
                    {settings.courseCode || "DEMO24"}
                  </code>
                  <span className="text-[10px] text-slate-400 font-normal">(수강생 접속용 식별자 · 읽기 전용)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>지도자: <strong className="text-slate-800 font-semibold">{roleLabels.instructor}</strong></span>
                  <span>•</span>
                  <span>참여자: <strong className="text-slate-800 font-semibold">{roleLabels.participant}</strong></span>
                </div>
              </div>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            대시보드와 각 화면에 노출되는 강의명 및 역할 명칭입니다. (참여자 실제 이름은 변경되지 않습니다.)
          </span>
        </div>

        {/* 2. 전체 수강생 수 및 차시 수 (조회용) */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between">
          <div className="space-y-2">
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">전체 {roleLabels.participant} 수</span>
              <strong className="text-sm font-bold text-slate-900">
                {settings.studentCount}명
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">전체 차시 수</span>
              <strong className="text-sm font-bold text-slate-900">
                {settings.lessonCount}개 차시
              </strong>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            인원 및 차시 규모 변경은 [강의 설정]에서 새 강의로 생성하세요.
          </span>
        </div>
      </div>
    </div>
  );
}
