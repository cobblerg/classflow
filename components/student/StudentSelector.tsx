import Link from "next/link";
import type { Student } from "@/types";

interface StudentSelectorProps {
  students: Student[]; // 학생/수강생 목록
  onSelect?: (student: Student) => void; // 선택 시 콜백 (세션 갱신 등)
}

// 학생/수강생 선택 목록 그리드 컴포넌트
export default function StudentSelector({
  students,
  onSelect,
}: StudentSelectorProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {students.map((student) => {
          const paddedNumber = String(student.number).padStart(2, "0");
          return (
            <Link
              key={student.id}
              href={`/student/${student.id}`}
              onClick={() => onSelect?.(student)}
              className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all text-center"
            >
              {/* 학생 번호 뱃지 */}
              <span className="text-xs font-mono font-medium text-slate-400 group-hover:text-blue-500 mb-1">
                {paddedNumber}
              </span>
              {/* 학생 이름 */}
              <span className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {student.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
