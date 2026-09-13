"use client";

import { useState, useEffect } from "react";
import type { ClassSettings, Student } from "@/types";
import { updateClassSettings, updateStudentName, getCurrentClassData } from "@/lib/tempStore";
import { getRoleLabels } from "@/lib/roleLabels";

interface ClassSettingsPanelProps {
  settings: ClassSettings;
  students?: Student[];
  onSettingsUpdated: () => void;
}

// 교사/강사용 강의 기본 설정 확인 및 강의명/역할명칭/수강생명단 수정 컴포넌트 (STEP 12, STEP 16, STEP 18)
export default function ClassSettingsPanel({
  settings,
  students: initialStudents,
  onSettingsUpdated,
}: ClassSettingsPanelProps) {
  const roleLabels = getRoleLabels(settings);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [classNameInput, setClassNameInput] = useState<string>(settings.className);
  const [instructorInput, setInstructorInput] = useState<string>(roleLabels.instructor);
  const [participantInput, setParticipantInput] = useState<string>(roleLabels.participant);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 수강생 개별 이름 수정 상태 (STEP 18)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState<string>("");
  const [studentErrorMsg, setStudentErrorMsg] = useState<string | null>(null);

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

  // 현재 학생 목록 조회 (props 우선, 미존재 시 스토어 조회)
  const currentClassData = getCurrentClassData();
  const studentsList = initialStudents || currentClassData?.students || [];

  // 개별 수강생 이름 수정 시작
  const handleStartEditStudent = (id: string, currentName: string) => {
    setEditingStudentId(id);
    setEditingStudentName(currentName);
    setStudentErrorMsg(null);
  };

  // 개별 수강생 이름 수정 취소
  const handleCancelEditStudent = () => {
    setEditingStudentId(null);
    setEditingStudentName("");
    setStudentErrorMsg(null);
  };

  // 개별 수강생 이름 수정 저장
  const handleSaveStudentName = (id: string) => {
    const trimmed = editingStudentName.trim();
    if (!trimmed) {
      setStudentErrorMsg("이름을 입력해 주세요.");
      return;
    }
    if (trimmed.length > 30) {
      setStudentErrorMsg("이름은 최대 30자까지 입력 가능합니다.");
      return;
    }

    const success = updateStudentName(id, trimmed);
    if (success) {
      setEditingStudentId(null);
      setEditingStudentName("");
      setStudentErrorMsg(null);
      setSuccessMsg("이름이 성공적으로 수정되었습니다.");
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

      {/* 3. 참여자 명단 관리 섹션 (STEP 18) */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">👥</span>
            <h4 className="text-sm font-bold text-slate-900">
              {roleLabels.participant} 관리
            </h4>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              총 {studentsList.length}명
            </span>
          </div>

          {studentErrorMsg && (
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              ⚠️ {studentErrorMsg}
            </span>
          )}
        </div>

        {/* 수강생 목록 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {studentsList.map((student) => {
            const isEditingThis = editingStudentId === student.id;

            return (
              <div
                key={student.id}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                  isEditingThis
                    ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-100"
                    : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* 번호 배지 */}
                <span className="font-mono text-[11px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-white border border-slate-200 shrink-0">
                  {String(student.number).padStart(2, "0")}
                </span>

                {/* 이름 및 인라인 편집 폼 */}
                {isEditingThis ? (
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <input
                      type="text"
                      value={editingStudentName}
                      onChange={(e) => setEditingStudentName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveStudentName(student.id);
                        } else if (e.key === "Escape") {
                          handleCancelEditStudent();
                        }
                      }}
                      maxLength={30}
                      autoFocus
                      aria-label={`${student.number}번 ${roleLabels.participant} 이름 수정`}
                      className="w-full px-2 py-1 rounded border border-blue-400 text-xs font-bold text-slate-900 bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveStudentName(student.id)}
                      className="px-2 py-1 rounded bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditStudent}
                      className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-300 transition-colors shrink-0 cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      className="flex-1 text-xs font-bold text-slate-800 truncate"
                      title={student.name}
                    >
                      {student.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleStartEditStudent(student.id, student.name)}
                      className="px-2 py-1 rounded text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all shrink-0 cursor-pointer"
                      title={`${student.name}의 이름을 수정합니다`}
                    >
                      이름 수정
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          💡 {roleLabels.participant} 이름을 수정해도 진행도(Progress), 이해도, 도움 요청, 피드백 등 모든 학습 데이터는 안전하게 보존됩니다.
        </p>
      </div>
    </div>
  );
}
