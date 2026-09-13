/**
 * ClassFlow 수강생/학생 명단 CSV 파싱 및 검증 유틸리티 (STEP 18)
 *
 * 지원 형식:
 * - 형식 A: 번호,이름 (또는 number,name)
 * - 형식 B: 이름 (또는 name)
 *
 * 규칙:
 * 1. UTF-8 인코딩 기본 지원
 * 2. 앞뒤 빈 줄 및 중간 빈 줄 자동 무시
 * 3. 각 이름은 trim() 처리 및 따옴표 제거
 * 4. 빈 이름 발견 시 행 번호 안내
 * 5. 최소 1명 이상, 최대 40명 제한
 * 6. 동명이인(중복 이름) 허용
 */

export const MAX_PARTICIPANT_COUNT = 40;

export interface ParsedParticipant {
  number: number; // 1부터 시작하는 순번
  name: string;   // 참여자 이름
}

export type ParseCsvResult =
  | { success: true; participants: ParsedParticipant[] }
  | { success: false; error: string };

/**
 * CSV 텍스트 문자열을 파싱하여 참여자 명단 배열로 변환하는 함수
 */
export function parseParticipantCsv(csvText: string): ParseCsvResult {
  if (!csvText || !csvText.trim()) {
    return {
      success: false,
      error: "CSV 파일이 비어 있습니다. 명단이 포함된 파일을 업로드해 주세요.",
    };
  }

  // 줄바꿈 문자 정규화 (\r\n 또는 \r -> \n)
  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // 유효한 줄만 필터링 (완전 빈 줄 제외하되 원본 행 번호 추적을 위해 인덱스 보존)
  const contentRows: { rawLine: string; originalLineIndex: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (raw.length > 0) {
      contentRows.push({ rawLine: raw, originalLineIndex: i + 1 });
    }
  }

  if (contentRows.length === 0) {
    return {
      success: false,
      error: "CSV 파일에 유효한 데이터가 없습니다.",
    };
  }

  // 첫 번째 행이 헤더인지 판단
  const firstRowCols = splitCsvLine(contentRows[0].rawLine);
  let hasHeader = false;
  let nameColIndex = 0;

  if (firstRowCols.length >= 2) {
    const col0 = firstRowCols[0].toLowerCase();
    const col1 = firstRowCols[1].toLowerCase();

    // "번호,이름" 또는 "number,name" 헤더
    if (
      (col0.includes("번호") || col0.includes("number") || col0.includes("no") || col0.includes("id")) &&
      (col1.includes("이름") || col1.includes("name"))
    ) {
      hasHeader = true;
      nameColIndex = 1;
    }
  } else if (firstRowCols.length === 1) {
    const col0 = firstRowCols[0].toLowerCase();
    // "이름" 또는 "name" 헤더
    if (col0 === "이름" || col0 === "name" || col0.includes("이름")) {
      hasHeader = true;
      nameColIndex = 0;
    }
  }

  // 헤더가 없고 2열 구조라면 (예: "1,김민지") 2번째 열을 이름으로 간주
  if (!hasHeader && firstRowCols.length >= 2) {
    nameColIndex = 1;
  }

  const dataRows = hasHeader ? contentRows.slice(1) : contentRows;

  if (dataRows.length === 0) {
    return {
      success: false,
      error: "헤더 외에 등록할 수강생 데이터가 없습니다.",
    };
  }

  if (dataRows.length > MAX_PARTICIPANT_COUNT) {
    return {
      success: false,
      error: `현재 MVP에서는 최대 ${MAX_PARTICIPANT_COUNT}명까지 등록할 수 있습니다. (현재 파일: ${dataRows.length}명)`,
    };
  }

  const participants: ParsedParticipant[] = [];

  for (let idx = 0; idx < dataRows.length; idx++) {
    const { rawLine, originalLineIndex } = dataRows[idx];
    const cols = splitCsvLine(rawLine);

    if (cols.length === 0) continue;

    let rawName = "";
    if (cols.length > nameColIndex) {
      rawName = cols[nameColIndex];
    } else {
      rawName = cols[0];
    }

    // 이름 정제 (따옴표 제거 및 trim)
    const cleanedName = cleanString(rawName);

    if (!cleanedName) {
      return {
        success: false,
        error: `${idx + 1}번째 데이터 행(${originalLineIndex}번 라인)의 이름이 비어 있습니다.`,
      };
    }

    if (cleanedName.length > 30) {
      return {
        success: false,
        error: `${idx + 1}번째 데이터 행의 이름('${cleanedName.slice(0, 10)}...')이 너무 깁니다. (최대 30자)`,
      };
    }

    participants.push({
      number: idx + 1,
      name: cleanedName,
    });
  }

  if (participants.length === 0) {
    return {
      success: false,
      error: "등록할 수 있는 유효한 이름 데이터가 없습니다.",
    };
  }

  return {
    success: true,
    participants,
  };
}

/**
 * 쉼표 구분 분리 (따옴표 묶인 필드 지원)
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

/**
 * 문자열에서 앞뒤 공백 및 겉따옴표 제거
 */
function cleanString(str: string): string {
  if (!str) return "";
  let trimmed = str.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}
