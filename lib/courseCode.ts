/**
 * ClassFlow 강의 코드(Course Code) 관리 유틸리티 (STEP 17)
 *
 * 규칙:
 * 1. 6자리 영문 대문자 + 숫자
 * 2. 사람이 읽고 입력하기 쉽도록 혼동을 주는 문자 제외 (0, O, 1, L, I 제외)
 *    - 영문: A B C D E F G H J K M N P Q R S T U V W X Y Z (23자)
 *    - 숫자: 2 3 4 5 6 7 8 9 (8자)
 *    - 총 31개 문자 조합 (31^6 = 약 8억 8천만 가지 조합)
 */

// 혼동하기 쉬운 문자(0, O, 1, I, L)를 제외한 문자 집합
export const COURSE_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const COURSE_CODE_LENGTH = 6;

/**
 * 6자리 랜덤 강의 코드를 생성하는 함수
 */
export function generateCourseCode(): string {
  let result = "";
  const charsLength = COURSE_CODE_CHARS.length;
  for (let i = 0; i < COURSE_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * charsLength);
    result += COURSE_CODE_CHARS[randomIndex];
  }
  return result;
}

/**
 * 사용자가 입력한 강의 코드를 정규화하는 함수
 * - 앞뒤 공백 제거 (trim)
 * - 대문자 변환 (toUpperCase)
 */
export function normalizeCourseCode(input: string): string {
  if (!input) return "";
  return input.trim().toUpperCase();
}

/**
 * 입력된 코드가 6자리 허용 문자 형식에 맞는지 검사하는 함수
 */
export function isValidCourseCodeFormat(code: string): boolean {
  if (!code || code.length !== COURSE_CODE_LENGTH) {
    return false;
  }
  const regex = new RegExp(`^[${COURSE_CODE_CHARS}]{${COURSE_CODE_LENGTH}}$`);
  return regex.test(code);
}
