import Link from "next/link";

// ClassFlow 메인 홈 화면 컴포넌트
export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
      {/* 카드 형태의 메인 컨테이너 */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-slate-200/80 p-8 sm:p-12 text-center transition-all">
        {/* 서비스 뱃지 */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          교육용 스마트 대시보드
        </div>

        {/* 메인 로고 및 서비스명 */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
          Class<span className="text-blue-600">Flow</span>
        </h1>

        {/* 슬로건 */}
        <p className="text-lg sm:text-xl font-medium text-slate-600 mb-8">
          배움과 성장이 보이는 학습 공간
        </p>

        {/* 서비스 핵심 설명 */}
        <div className="bg-slate-50 rounded-2xl p-5 mb-8 text-left border border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed">
            참여자별 학습 진행도와 실시간 도움 요청을 한 화면에서 직관적으로 확인하고, 적시에 개별 피드백을 전달할 수 있습니다.
          </p>
        </div>

        {/* 액션 버튼 영역 */}
        <div className="flex flex-col gap-3">
          {/* 새 강의 만들기 버튼 */}
          <Link
            href="/setup"
            className="w-full inline-flex items-center justify-center px-6 py-4 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20"
          >
            새 강의 만들기
          </Link>

          {/* 학습자 화면 이동 버튼 */}
          <Link
            href="/student"
            className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 active:scale-[0.99] transition-all"
          >
            👥 수강생 / 학생 화면
          </Link>

          {/* 대시보드 바로가기 버튼 */}
          <Link
            href="/teacher"
            className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 active:scale-[0.99] transition-all"
          >
            📊 강사 / 교사 대시보드
          </Link>
        </div>

        {/* 하단 버전 표시 */}
        <p className="mt-8 text-xs text-slate-400">
          ClassFlow MVP v2.0 · 프로토타입
        </p>
      </div>
    </main>
  );
}
