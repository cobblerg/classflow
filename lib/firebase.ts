import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

/**
 * Firebase Web SDK 설정 인터페이스
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * 필수 환경변수 설정 여부 검증 (요구사항 #15, #16)
 * - 실제 API Key 등의 비밀 값을 노출하지 않고 누락 여부만 안전하게 확인합니다.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

/**
 * 현재 연결된 Firebase 프로젝트 ID 확인 헬퍼 (요구사항 #20, #21)
 */
export function getFirebaseProjectId(): string | null {
  return firebaseConfig.projectId || null;
}

/**
 * Firebase App 인스턴스 초기화
 * - Fast Refresh / Hot Reload 시 중복 초기화 에러("[DEFAULT] already exists") 방지 (요구사항 #14)
 * - 환경변수 미설정 상태에서도 빌드(npm run build)가 깨지지 않도록 안전하게 가드 (요구사항 #26, #28)
 */
function getFirebaseAppInstance(): FirebaseApp | null {
  if (getApps().length > 0) {
    return getApp();
  }

  if (!isFirebaseConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[ClassFlow Firebase] Firebase configuration is missing or incomplete.\n" +
        "Check NEXT_PUBLIC_FIREBASE_* variables in your .env.local file.\n" +
        "Refer to docs/firebase-setup.md for step-by-step instructions."
      );
    }
    return null;
  }

  try {
    const app = initializeApp(firebaseConfig);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[ClassFlow Firebase] Initialized successfully. (Project: ${firebaseConfig.projectId})`
      );
    }

    return app;
  } catch (error) {
    console.error("[ClassFlow Firebase] Failed to initialize Firebase App:", error);
    return null;
  }
}

export const firebaseApp = getFirebaseAppInstance();
