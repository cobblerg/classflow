"use client";

import { useState } from "react";
import Link from "next/link";
import { createTestCourse, getTestCourse, type TestCourseData } from "@/lib/firestoreTest";

/**
 * 개발 환경 전용 Firebase Firestore 연결 검증 페이지
 * (요구사항 #26, #27, #28, #30)
 * - 일반 사용자 화면 및 내비게이션 바에는 일절 노출되지 않습니다.
 * - STEP 20 검증 목적으로만 사용되며, 기존 ClassFlow 데이터(localStorage)에는 아무런 영향을 주지 않습니다.
 */
export default function FirebaseTestDevPage() {
  const isDev = process.env.NODE_ENV === "development";

  const [createdDocId, setCreatedDocId] = useState<string>("");
  const [readResult, setReadResult] = useState<TestCourseData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  if (!isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
        <div className="bg-white p-8 rounded-xl shadow border border-slate-200 text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">접근 불가 (Development Only)</h1>
          <p className="text-sm text-slate-600 mb-4">
            이 페이지는 개발(development) 환경에서만 기술 검증 목적으로 접근할 수 있습니다.
          </p>
          <Link href="/" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  // 1. 테스트 문서 생성 핸들러
  const handleCreateTestCourse = async () => {
    setLoading(true);
    setErrorMessage("");
    setStatusMessage("");
    setReadResult(null);

    const result = await createTestCourse();
    setLoading(false);

    if (result.success && result.documentId) {
      setCreatedDocId(result.documentId);
      setStatusMessage(`✅ Firestore 'courses' 컬렉션에 테스트 문서 생성 성공! (ID: ${result.documentId})`);
    } else {
      setErrorMessage(`❌ 문서 생성 실패: ${result.error || "알 수 없는 오류"}`);
    }
  };

  // 2. 생성된 문서 읽기 핸들러
  const handleReadTestCourse = async () => {
    if (!createdDocId) {
      setErrorMessage("먼저 테스트 문서를 생성하거나 Document ID를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    const result = await getTestCourse(createdDocId);
    setLoading(false);

    if (result.success && result.data) {
      setReadResult(result.data);
      setStatusMessage("✅ Firestore에서 테스트 문서를 성공적으로 읽어왔습니다.");
    } else {
      setErrorMessage(`❌ 문서 읽기 실패: ${result.error || "알 수 없는 오류"}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-800">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
          <div>
            <div className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-md mb-2">
              🛠️ 개발 전용 도구 (STEP 20)
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Cloud Firestore 연결 및 테스트 검증</h1>
            <p className="text-sm text-slate-500 mt-1">
              Firebase Console의 Firestore Database와 실제 통신이 이루어지는지 안전하게 테스트합니다.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg"
          >
            ← 홈으로
          </Link>
        </div>

        {/* 안내 배너 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-xs text-blue-900 leading-relaxed">
          <p className="font-semibold mb-1">📌 주의 및 안내 사항:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>이 화면은 개발자 테스트용이며 일반 사용자에게는 노출되지 않습니다.</li>
            <li>기존 ClassFlow의 모든 운영 데이터는 여전히 <strong>100% localStorage</strong>에 안전하게 보존됩니다.</li>
            <li>Firebase Console의 <code>Firestore Database &gt; Data</code> 탭에서 생성된 <code>courses</code> 컬렉션을 확인하실 수 있습니다.</li>
          </ul>
        </div>

        {/* 액션 버튼 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
            <h2 className="font-semibold text-sm text-slate-900 mb-2">1단계: 테스트 Course 저장</h2>
            <p className="text-xs text-slate-500 mb-4">
              <code>courses</code> 컬렉션에 <code>[TEST] ClassFlow Firestore</code> 문서를 1개 저장합니다.
            </p>
            <button
              onClick={handleCreateTestCourse}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
            >
              {loading ? "저장 중..." : "테스트 문서 1개 생성"}
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
            <h2 className="font-semibold text-sm text-slate-900 mb-2">2단계: 생성된 문서 읽기</h2>
            <p className="text-xs text-slate-500 mb-4">
              방금 생성된 Document ID로 Firestore에서 문서를 다시 조회합니다.
            </p>
            <button
              onClick={handleReadTestCourse}
              disabled={loading || !createdDocId}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
            >
              {loading ? "조회 중..." : "생성된 문서 읽기 확인"}
            </button>
          </div>
        </div>

        {/* 상태 및 오류 메시지 */}
        {statusMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl">
            <p className="font-semibold mb-1">오류 발생:</p>
            <p className="text-xs">{errorMessage}</p>
            <p className="text-xs text-rose-600 mt-2">
              💡 팁: Firebase Console에서 Firestore Database가 생성되어 있는지, 또는 Rules가 허용되어 있는지 확인해 보세요.
            </p>
          </div>
        )}

        {/* 생성된 문서 ID 및 읽기 결과 */}
        {createdDocId && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">📄 생성된 Firestore Document ID</h3>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={createdDocId}
                onChange={(e) => setCreatedDocId(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50 text-slate-700"
                placeholder="Document ID"
              />
            </div>

            {readResult && (
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                <div className="text-slate-400 mb-2 font-sans font-semibold">// Firestore에서 성공적으로 읽어온 문서 데이터:</div>
                <pre>{JSON.stringify(readResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* 콘솔 확인 안내 */}
        <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">🔍 Firebase Console에서 확인하는 방법:</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li><a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Firebase Console</a>에 접속하여 해당 프로젝트를 엽니다.</li>
            <li>좌측 메뉴 <strong>빌드(Build) &gt; Firestore Database</strong>로 이동합니다.</li>
            <li><strong>데이터(Data)</strong> 탭을 클릭하고, <code>courses</code> 컬렉션 안에 위 Document ID가 생성되었는지 확인합니다.</li>
            <li><code>title: "[TEST] ClassFlow Firestore"</code>, <code>courseCode: "TEST20"</code> 등의 필드가 정상적으로 저장되어 있는지 확인합니다.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
