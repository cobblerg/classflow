import type { ClassFlowData } from "@/types";

// 모듈 스코프 메모리 저장소 (STEP 2 임시용, 새로고침 시 초기화됨)
let inMemoryClassData: ClassFlowData | null = null;

/**
 * 생성된 수업 데이터를 메모리 저장소에 저장하는 함수
 */
export function setCurrentClassData(data: ClassFlowData): void {
  inMemoryClassData = data;
}

/**
 * 현재 메모리에 보관된 수업 데이터를 조회하는 함수
 */
export function getCurrentClassData(): ClassFlowData | null {
  return inMemoryClassData;
}
