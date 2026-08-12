import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Request Tester",
  description: "HTTP 요청 전송·응답 확인·헤더/바디 설정. 무료 온라인 API 테스터.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
