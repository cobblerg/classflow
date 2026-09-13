import type {
  ClassFlowData,
  Student,
  Lesson,
  Progress,
  HelpRequest,
  Feedback,
  Submission,
} from "@/types";

/**
 * 교사가 ClassFlow의 모든 핵심 기능(Grid, Help Queue, Feedback, 차시 공개 등)을
 * 복잡한 설정 없이 한눈에 체험할 수 있도록 현실적인 데모 데이터를 생성하는 함수 (STEP 13)
 *
 * - 학급 규모: 20명 학생 × 10차시 = 정확히 200개의 Progress
 * - 1~4차시: 공개(published: true)
 * - 5~10차시: 비공개(published: false)
 * - 상대 시간: 데모 생성 시점(Date.now())을 기준으로 N분 전으로 계산
 */
export function createDemoClassData(): ClassFlowData {
  const now = Date.now();
  const getRelativeIso = (minutesAgo: number) =>
    new Date(now - minutesAgo * 60 * 1000).toISOString();

  // 1. 참여자 20명 생성 (개인정보 보호 가명: 01 수강생01 ~ 20 수강생20, ID는 student-XX 호환 유지)
  const students: Student[] = Array.from({ length: 20 }, (_, idx) => {
    const num = idx + 1;
    const padded = String(num).padStart(2, "0");
    return {
      id: `student-${padded}`,
      number: num,
      name: `수강생${padded}`,
    };
  });

  // 2. 차시 10개 생성 (1~4차시 공개, 5~10차시 비공개, 학습 목표 및 과제 내용 포함)
  const lessonMeta: Array<{
    title: string;
    objective: string;
    description: string;
    published: boolean;
  }> = [
    {
      title: "1차시 LED 켜기",
      objective: "디지털 출력 핀(GPIO)의 기본 원리를 이해하고 코드를 통해 LED를 켤 수 있다.",
      description: "LED의 긴 다리를 GP15에, 짧은 다리를 GND에 연결하세요. 마이크로파이썬 Pin 모듈을 사용하여 LED를 켜는 코드를 작성해 보세요.",
      published: true,
    },
    {
      title: "2차시 LED 깜빡이기",
      objective: "time 모듈의 sleep 함수를 활용하여 지정한 시간 간격으로 LED를 제어할 수 있다.",
      description: "LED가 1초 동안 켜지고 1초 동안 꺼지는 동작을 무한 반복하도록 while True 반복문을 작성해 보세요.",
      published: true,
    },
    {
      title: "3차시 버튼으로 LED 제어",
      objective: "디지털 입력 핀과 버튼 스위치의 동작 원리를 이해하고 입력에 반응하는 제어 회로를 구성할 수 있다.",
      description: "버튼을 GP14에 연결하세요. 버튼을 누르고 있는 동안에만 LED가 켜지고 손을 떼면 꺼지도록 조건문(if-else)을 작성해 보세요.",
      published: true,
    },
    {
      title: "4차시 부저 제어",
      objective: "PWM(펄스 폭 변조) 신호를 이용하여 피에조 부저의 음계 주파수를 제어할 수 있다.",
      description: "부저를 GP16에 연결하고 도-레-미 음계를 차례대로 연주하는 프로그램을 완성하세요.",
      published: true,
    },
    {
      title: "5차시 버튼과 부저",
      objective: "버튼 입력 시 부저에서 경고음이 울리는 도난 경보 장치를 제작할 수 있다.",
      description: "버튼을 누르면 부저가 3회 삐-삐-삐 소리를 내며 LED가 함께 깜빡이도록 센서 복합 제어를 구현하세요.",
      published: false,
    },
    {
      title: "6차시 조건문 활용",
      objective: "다양한 센서 상태에 따라 다중 조건 분기(if-elif-else)를 처리할 수 있다.",
      description: "입력값의 크기에 따라 각기 다른 3가지 LED 패턴을 출력하는 로직을 프로그래밍하세요.",
      published: false,
    },
    {
      title: "7차시 반복문 활용",
      objective: "for 문과 리스트 자료구조를 활용하여 센서 데이터 패턴을 순차적으로 제어할 수 있다.",
      description: "주파수 리스트를 순회하며 멜로디 음악을 재생하는 코드 함수를 구현하세요.",
      published: false,
    },
    {
      title: "8차시 미니 프로젝트 설계",
      objective: "실생활의 문제를 해결하기 위한 스마트 피지컬 컴퓨팅 장치를 기획하고 회로를 설계할 수 있다.",
      description: "팀별 아이디어를 바탕으로 필요한 센서와 액추에이터의 핀 번호 할당표와 흐름도를 작성하세요.",
      published: false,
    },
    {
      title: "9차시 미니 프로젝트 제작",
      objective: "기획한 하드웨어 회로를 브레드보드에 구현하고 메인 제어 소프트웨어를 코딩할 수 있다.",
      description: "피지컬 장치를 조립하고 예외 케이스를 디버깅하며 완성도를 높이세요.",
      published: false,
    },
    {
      title: "10차시 프로젝트 발표",
      objective: "제작한 스마트 장치의 동작 원리와 제작 과정을 다른 학생들에게 발표하고 피드백을 나눌 수 있다.",
      description: "시연 영상이나 실물 동작을 보여주고 질의응답을 진행하세요.",
      published: false,
    },
  ];

  const lessons: Lesson[] = lessonMeta.map((meta, idx) => {
    const num = idx + 1;
    const padded = String(num).padStart(2, "0");
    return {
      id: `lesson-${padded}`,
      number: num,
      title: meta.title,
      objective: meta.objective,
      description: meta.description,
      published: meta.published,
    };
  });

  // 3. Progress 데이터 200개 생성 (모든 studentId × lessonId 조합을 자연스러운 분포로 구성)
  const progress: Progress[] = [];

  for (const student of students) {
    for (const lesson of lessons) {
      let status: "not_started" | "in_progress" | "completed" = "not_started";
      let understanding: "understood" | "difficult" | "need_help" | null = null;
      let updateMinutesAgo = 40;

      const sNum = student.number;
      const lNum = lesson.number;

      // 1차시: 전원 완료 또는 진행 중 (기초 차시)
      if (lNum === 1) {
        if (sNum <= 16) {
          status = "completed";
          understanding = sNum % 3 === 0 ? "understood" : null;
          updateMinutesAgo = 35;
        } else {
          status = "in_progress";
          updateMinutesAgo = 30;
        }
      }
      // 2차시: 절반 완료, 절반 진행 중
      else if (lNum === 2) {
        if (sNum <= 8) {
          status = "completed";
          understanding = "understood";
          updateMinutesAgo = 25;
        } else if (sNum <= 17) {
          status = "in_progress";
          // 학생12: 2차시 진행 중 + difficult (Help Queue 3순위 대표 사례)
          if (sNum === 12) {
            understanding = "difficult";
            updateMinutesAgo = 18;
          }
          // 학생15: 2차시 완료 + need_help (완료 ≠ 이해 독립성 검증 사례)
          else if (sNum === 15) {
            status = "completed";
            understanding = "need_help";
            updateMinutesAgo = 14;
          } else {
            understanding = null;
            updateMinutesAgo = 20;
          }
        } else {
          status = "not_started";
          updateMinutesAgo = 40;
        }
      }
      // 3차시 (현재 활발히 진행 중인 수업 차시)
      else if (lNum === 3) {
        // 학생01, 학생02: 진도가 빠른 학생 (완료)
        if (sNum <= 2) {
          status = "completed";
          understanding = "understood";
          updateMinutesAgo = 15;
        }
        // 학생03: 3차시 진행 중 + need_help + waiting HelpRequest (Help Queue 최우선 1순위 대표)
        else if (sNum === 3) {
          status = "in_progress";
          understanding = "need_help";
          updateMinutesAgo = 15;
        }
        // 학생07: 3차시 진행 중 + need_help (직접 요청은 안 했으나 도움 필요, Help Queue 2순위 대표)
        else if (sNum === 7) {
          status = "in_progress";
          understanding = "need_help";
          updateMinutesAgo = 12;
        }
        // 학생09: 3차시 진행 중 + waiting HelpRequest (5분 전 요청)
        else if (sNum === 9) {
          status = "in_progress";
          understanding = "understood";
          updateMinutesAgo = 5;
        }
        // 일반 진행 중 학생들
        else if (sNum <= 14) {
          status = "in_progress";
          understanding = sNum % 4 === 0 ? "difficult" : null;
          updateMinutesAgo = 10;
        }
        // 아직 3차시 시작 전인 학생들
        else {
          status = "not_started";
          updateMinutesAgo = 30;
        }
      }
      // 4차시: 공개 차시이지만 진도가 빠른 학생 소수만 진행 중
      else if (lNum === 4) {
        if (sNum <= 3) {
          status = "in_progress";
          updateMinutesAgo = 5;
        } else {
          status = "not_started";
          updateMinutesAgo = 30;
        }
      }
      // 5~10차시 (비공개 차시): 모두 시작 전
      else {
        status = "not_started";
        understanding = null;
        updateMinutesAgo = 60;
      }

      progress.push({
        studentId: student.id,
        lessonId: lesson.id,
        status,
        understanding,
        updatedAt: getRelativeIso(updateMinutesAgo),
      });
    }
  }

  // 4. HelpRequests 생성 (waiting 2건, resolved 1건, cancelled 1건)
  const helpRequests: HelpRequest[] = [
    // 1) 학생03 × 3차시: waiting (15분 전, 최우선 1순위)
    {
      id: "help-demo-03-03",
      studentId: "student-03",
      lessonId: "lesson-03",
      message: "버튼 입력값을 읽는 부분이 어려워요.",
      status: "waiting",
      requestedAt: getRelativeIso(15),
    },
    // 2) 학생09 × 3차시: waiting (5분 전, 1순위 중 시간순 뒤)
    {
      id: "help-demo-09-03",
      studentId: "student-09",
      lessonId: "lesson-03",
      message: "시리얼 모니터에 값이 계속 0만 출력돼요.",
      status: "waiting",
      requestedAt: getRelativeIso(5),
    },
    // 3) 학생05 × 2차시: resolved (20분 전 요청, 10분 전 해결 완료 이력)
    {
      id: "help-demo-05-02",
      studentId: "student-05",
      lessonId: "lesson-02",
      message: "LED 깜빡임 주기를 0.5초로 하려면 어떻게 하나요?",
      status: "resolved",
      requestedAt: getRelativeIso(20),
      resolvedAt: getRelativeIso(10),
    },
    // 4) 학생10 × 2차시: cancelled (25분 전 요청, 22분 전 취소 이력)
    {
      id: "help-demo-10-02",
      studentId: "student-10",
      lessonId: "lesson-02",
      message: "코드 에러 질문 취소합니다 스스로 해결했어요!",
      status: "cancelled",
      requestedAt: getRelativeIso(25),
    },
  ];

  // 5. Feedback 생성 (학생05, 학생08)
  const feedback: Feedback[] = [
    {
      studentId: "student-05",
      lessonId: "lesson-02",
      content: "반복문 안의 sleep(0.5) 코드를 잘 작성하셨네요! 조건문도 이어서 시도해 보세요.",
      updatedAt: getRelativeIso(10),
    },
    {
      studentId: "student-08",
      lessonId: "lesson-03",
      content: "버튼 입력값이 0과 1 중 언제 바뀌는지 시리얼 모니터로 확인해보세요.",
      updatedAt: getRelativeIso(8),
    },
  ];

  // 6. Submissions 생성 (학생01 1차시 결과물 제출 예시)
  const submissions: Submission[] = [
    {
      studentId: "student-01",
      lessonId: "lesson-01",
      content: "GP15 핀에 LED를 연결하여 켜는 파이썬 코드를 정상적으로 작성하고 동작을 확인했습니다.",
      question: "다음 2차시 깜빡이기 실습도 바로 시작해도 되나요?",
      updatedAt: getRelativeIso(30),
    },
  ];

  return {
    settings: {
      className: "AI와 피지컬 컴퓨팅 (데모)",
      studentCount: 20,
      lessonCount: 10,
      createdAt: getRelativeIso(60),
      roleLabels: {
        instructor: "강사",
        participant: "수강생",
      },
    },
    students,
    lessons,
    progress,
    helpRequests,
    feedback,
    submissions,
  };
}
