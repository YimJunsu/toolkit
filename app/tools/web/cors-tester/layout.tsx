import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CORS Header Tester",
  description: "URL의 CORS 허용 헤더 확인·Access-Control 헤더 분석. 무료 온라인 CORS 테스터.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
