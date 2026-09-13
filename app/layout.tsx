import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/firebase";

// 폰트 설정 (영문 및 숫자용 가독성 폰트)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 페이지 메타데이터 (제목 및 검색엔진 색인 방지 설정)
export const metadata: Metadata = {
  title: "ClassFlow - 학생의 배움이 보이는 교실",
  description: "학생의 학습 진행 상황과 도움 필요 여부를 한눈에 파악할 수 있는 교육용 대시보드",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800">
        {children}
      </body>
    </html>
  );
}

