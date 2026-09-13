"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClassData } from "@/lib/createClassData";
import { createDemoClassData } from "@/data/demoData";
import { setCurrentClassData, getCurrentClassData } from "@/lib/tempStore";
import { DEFAULT_ROLE_LABELS, SCHOOL_ROLE_LABELS } from "@/lib/roleLabels";
import { generateCourseCode } from "@/lib/courseCode";
import { parseParticipantCsv, type ParsedParticipant } from "@/lib/parseParticipantCsv";
import type { ClassSettings, RoleLabels } from "@/types";

type PresetType = "general" | "school" | "custom";
type RosterMethod = "auto" | "csv";

// 수업/강의 설정 폼 컴포넌트 (STEP 16 범용화, STEP 18 명단 관리)
export default function ClassSetupForm() {
  const router = useRouter();

  // 1. 입력 폼 상태 관리
  const [className, setClassName] = useState<string>("AI와 피지컬 컴퓨팅");
  const [studentCount, setStudentCount] = useState<number | string>(20);
  const [lessonCount, setLessonCount] = useState<number | string>(10);
  const [preset, setPreset] = useState<PresetType>("general");
  const [instructorLabel, setInstructorLabel] = useState<string>("강사");
  const [participantLabel, setParticipantLabel] = useState<string>("수강생");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 1-1. 수강생 명단 준비 방식 (자동 생성 vs CSV 업로드, STEP 18)
  const [rosterMethod, setRosterMethod] = useState<RosterMethod>("auto");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParticipants, setCsvParticipants] = useState<ParsedParticipant[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  // 2. 오류 메시지 상태 관리
  const [errors, setErrors] = useState<{
    className?: string;
    studentCount?: string;
    lessonCount?: string;
    instructorLabel?: string;
    participantLabel?: string;
  }>({});

  // 3. 제출 완료 결과 확인용 상태
  const [submittedSettings, setSubmittedSettings] = useState<ClassSettings | null>(null);

  // 프리셋 변경 핸들러 (일반 강의: 강사/수강생, 학교 수업: 교사/학생, 직접 설정: 사용자 지정)
  const handlePresetChange = (newPreset: PresetType) => {
    setPreset(newPreset);
    if (newPreset === "general") {
      setInstructorLabel(DEFAULT_ROLE_LABELS.instructor);
      setParticipantLabel(DEFAULT_ROLE_LABELS.participant);
    } else if (newPreset === "school") {
      setInstructorLabel(SCHOOL_ROLE_LABELS.instructor);
      setParticipantLabel(SCHOOL_ROLE_LABELS.participant);
    }
  };

  // CSV 파일 선택 및 파싱 핸들러 (STEP 18)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvError("CSV 파일만 업로드할 수 있습니다.");
      setCsvFile(null);
      setCsvParticipants([]);
      return;
    }

    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parseResult = parseParticipantCsv(text);
      if (parseResult.success) {
        setCsvParticipants(parseResult.participants);
        setCsvError(null);
        setStudentCount(parseResult.participants.length);
      } else {
        setCsvError(parseResult.error);
        setCsvParticipants([]);
      }
    };
    reader.onerror = () => {
      setCsvError("파일을 읽는 중 오류가 발생했습니다. 다시 시도해 주세요.");
    };
    reader.readAsText(file, "UTF-8");
  };

  // CSV 재선택 핸들러
  const handleResetCsv = () => {
    setCsvFile(null);
    setCsvParticipants([]);
    setCsvError(null);
  };

  // 입력값 검증 함수
  const validateForm = (): boolean => {
    const newErrors: {
      className?: string;
      studentCount?: string;
      lessonCount?: string;
      instructorLabel?: string;
      participantLabel?: string;
    } = {};

    // 강의명 검증
    if (!className.trim()) {
      newErrors.className = "강의명을 입력해 주세요.";
    }

    // 인원수 검증 (자동 생성 방식일 때만 인풋 검증)
    if (rosterMethod === "auto") {
      const parsedStudents = Number(studentCount);
      if (isNaN(parsedStudents) || !Number.isInteger(parsedStudents)) {
        newErrors.studentCount = `${participantLabel} 수를 숫자로 정확히 입력해 주세요.`;
      } else if (parsedStudents < 1 || parsedStudents > 40) {
        newErrors.studentCount = `${participantLabel} 수는 1명에서 40명 사이로 입력해 주세요.`;
      }
    } else {
      // CSV 업로드 방식일 때 명단 존재 여부 검증
      if (csvParticipants.length === 0) {
        setCsvError("수강생 명단 CSV 파일을 업로드해 주세요.");
        return false;
      }
    }

    // 차시 수 검증 (1 ~ 30)
    const parsedLessons = Number(lessonCount);
    if (isNaN(parsedLessons) || !Number.isInteger(parsedLessons)) {
      newErrors.lessonCount = "차시 수를 숫자로 정확히 입력해 주세요.";
    } else if (parsedLessons < 1 || parsedLessons > 30) {
      newErrors.lessonCount = "차시 수는 1차시에서 30차시 사이로 입력해 주세요.";
    }

    // 직접 설정 시 역할 명칭 검증
    if (preset === "custom") {
      if (!instructorLabel.trim()) {
        newErrors.instructorLabel = "지도자/진행자 명칭을 입력해 주세요.";
      }
      if (!participantLabel.trim()) {
        newErrors.participantLabel = "참여자/학습자 명칭을 입력해 주세요.";
      }
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

    setIsSubmitting(true);

    const roleLabels: RoleLabels = {
      instructor: instructorLabel.trim() || DEFAULT_ROLE_LABELS.instructor,
      participant: participantLabel.trim() || DEFAULT_ROLE_LABELS.participant,
    };

    const finalStudentCount = rosterMethod === "csv" ? csvParticipants.length : Number(studentCount);

    const newSettings: ClassSettings = {
      className: className.trim(),
      studentCount: finalStudentCount,
      lessonCount: Number(lessonCount),
      createdAt: new Date().toISOString(),
      roleLabels,
      courseCode: generateCourseCode(),
    };

    // 1. lib/createClassData를 통해 학생(수강생), 차시, Progress 데이터 동적 생성
    // (CSV 명단이 있을 경우 해당 명단으로 생성)
    const customStudents = rosterMethod === "csv" ? csvParticipants : undefined;
    const classFlowData = createClassData(newSettings, customStudents);

    // 2. 임시 인메모리 스토어 및 localStorage에 보관
    setCurrentClassData(classFlowData);
    setSubmittedSettings(newSettings);

    // 3. 생성 결과 확인 화면(/teacher)으로 이동
    router.push("/teacher");
  };

  // 데모 강의 시작 핸들러 (STEP 13, 기존 데이터 보호 확인 포함)
  const handleStartDemo = () => {
    const existingData = getCurrentClassData();
    if (existingData) {
      const confirmed = window.confirm(
        "현재 저장된 강의 데이터가 있습니다.\n\n데모 강의를 시작하면 현재 데이터가 데모 데이터로 교체됩니다.\n\n계속하시겠습니까?"
      );
      if (!confirmed) return;
    }

    const demoData = createDemoClassData();
    setCurrentClassData(demoData);
    router.push("/teacher");
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
            강의 설정
          </h1>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          설정
        </span>
      </div>

      {/* MVP 로컬 브라우저 저장 및 개인정보 보호 안내 배너 */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed mb-6">
        <div className="flex items-center gap-1.5 font-bold mb-1">
          <span>⚠</span>
          <span>MVP 테스트 버전</span>
        </div>
        <p className="text-amber-800">
          현재 데이터는 이 브라우저에만 저장됩니다. 실제 개인정보 대신 테스트용 이름을 사용하세요.
        </p>
      </div>

      {/* 🎓 데모 강의로 시작하기 빠른 실행 카드 (STEP 13) */}
      <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 font-bold text-sm text-indigo-900 mb-1">
            <span>🎓</span>
            <span>데모 강의로 시작하기</span>
          </div>
          <p className="text-xs text-indigo-700 leading-relaxed">
            수강생들의 다양한 학습 상태(진행도, 이해도, 도움 요청 등)가 미리 입력된 테스트용 강의(20명×10차시)를 바로 체험할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartDemo}
          className="shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-500/20 text-center cursor-pointer"
        >
          데모 시작 →
        </button>
      </div>

      <div className="relative flex py-1 items-center mb-6">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400">또는 새 강의 직접 설정</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        진행할 강의의 기본 정보와 사용 환경을 선택해 주세요. 입력한 규모와 명칭에 맞춰 대시보드가 자동으로 구성됩니다.
      </p>

      {/* 설정 폼 영역 */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* 사용 환경 프리셋 선택 (요구사항 #6, #7, #8, #9) */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            사용 환경 프리셋 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. 일반 강의 / 특강 */}
            <button
              type="button"
              onClick={() => handlePresetChange("general")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                preset === "general"
                  ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-200"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="text-xs font-bold text-slate-900 mb-0.5">일반 강의 / 특강</div>
              <div className="text-[11px] text-slate-500 font-medium">강사 / 수강생</div>
            </button>

            {/* 2. 학교 수업 */}
            <button
              type="button"
              onClick={() => handlePresetChange("school")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                preset === "school"
                  ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-200"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="text-xs font-bold text-slate-900 mb-0.5">학교 수업</div>
              <div className="text-[11px] text-slate-500 font-medium">교사 / 학생</div>
            </button>

            {/* 3. 직접 설정 */}
            <button
              type="button"
              onClick={() => handlePresetChange("custom")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                preset === "custom"
                  ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-200"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="text-xs font-bold text-slate-900 mb-0.5">직접 설정</div>
              <div className="text-[11px] text-slate-500 font-medium">사용자 지정</div>
            </button>
          </div>

          {/* 직접 설정 시 명칭 입력 필드 */}
          {preset === "custom" && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  지도자 명칭 (예: 진행자, 멘토)
                </label>
                <input
                  type="text"
                  value={instructorLabel}
                  onChange={(e) => setInstructorLabel(e.target.value)}
                  placeholder="진행자"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.instructorLabel && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.instructorLabel}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  참여자 명칭 (예: 참여자, 멘티)
                </label>
                <input
                  type="text"
                  value={participantLabel}
                  onChange={(e) => setParticipantLabel(e.target.value)}
                  placeholder="참여자"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.participantLabel && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.participantLabel}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 1. 강의명 입력 */}
        <div>
          <label
            htmlFor="className"
            className="block text-sm font-semibold text-slate-800 mb-2"
          >
            강의명 <span className="text-red-500">*</span>
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
              강의나 수업의 주제, 과목명을 적어주세요.
            </p>
          )}
        </div>

        {/* 2. 참여자 명단 준비 방법 (자동 생성 vs CSV 업로드, STEP 18) */}
        <div className="pt-1">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            {participantLabel} 명단 준비 방법 <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <label
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                rosterMethod === "auto"
                  ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-2xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="rosterMethod"
                value="auto"
                checked={rosterMethod === "auto"}
                onChange={() => {
                  setRosterMethod("auto");
                  setCsvError(null);
                }}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs">인원수로 자동 생성</span>
            </label>

            <label
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                rosterMethod === "csv"
                  ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-2xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="rosterMethod"
                value="csv"
                checked={rosterMethod === "csv"}
                onChange={() => {
                  setRosterMethod("csv");
                  setErrors((prev) => ({ ...prev, studentCount: undefined }));
                }}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs">CSV 파일 업로드</span>
            </label>
          </div>

          {/* 방법 A: 인원수로 자동 생성 UI */}
          {rosterMethod === "auto" ? (
            <div>
              <label
                htmlFor="studentCount"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {participantLabel} 수
                <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                  (1 ~ 40명, 번호순으로 자동 생성)
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
                  예: 20명 입력 시 '01 {participantLabel}01'부터 '20 {participantLabel}20'까지 자동 생성됩니다.
                </p>
              )}
            </div>
          ) : (
            /* 방법 B: CSV 파일 업로드 및 미리보기 UI */
            <div className="space-y-3">
              {csvParticipants.length === 0 ? (
                <div>
                  <label
                    htmlFor="csv-upload"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    CSV 파일 선택 (.csv)
                  </label>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer border border-slate-300 rounded-xl p-2 bg-slate-50/50"
                  />

                  {csvError && (
                    <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                      ⚠️ {csvError}
                    </div>
                  )}

                  {/* CSV 작성 샘플 안내 (요구사항 #35) */}
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-700">💡 CSV 권장 형식 예시</p>
                    <pre className="p-2 rounded bg-white border border-slate-200 font-mono text-[10.5px] text-slate-700 leading-tight">
{`번호,이름
1,김민지
2,이준호
3,박서연`}
                    </pre>
                    <p className="text-slate-400 text-[10px]">
                      * '이름' 열만 있는 단일 열 형식도 지원합니다. (최대 40명)
                    </p>
                  </div>
                </div>
              ) : (
                /* CSV 업로드 명단 미리보기 카드 (요구사항 #15) */
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-blue-900">
                        📋 {participantLabel} 명단 미리보기
                      </h4>
                      <span className="text-[11px] text-blue-700 font-medium">
                        총 {csvParticipants.length}명 등록됨
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetCsv}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      🔄 다시 선택
                    </button>
                  </div>

                  {/* 명단 리스트 박스 */}
                  <div className="max-h-40 overflow-y-auto rounded-xl bg-white border border-blue-100 p-2 space-y-1 divide-y divide-slate-100 scrollbar-thin">
                    {csvParticipants.map((p) => (
                      <div
                        key={p.number}
                        className="flex items-center justify-between px-2.5 py-1.5 text-xs"
                      >
                        <span className="font-mono text-slate-400 font-semibold">
                          {String(p.number).padStart(2, "0")}
                        </span>
                        <span className="font-bold text-slate-800">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-blue-700/80">
                    ✓ 이 명단으로 {csvParticipants.length}명의 {participantLabel} 계정이 자동 생성됩니다.
                  </p>
                </div>
              )}
            </div>
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
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center px-6 py-4 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:bg-blue-300 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? "데이터 생성 중..." : "강의 만들기"}
          </button>
        </div>
      </form>

    </div>
  );
}
