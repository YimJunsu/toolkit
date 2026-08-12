import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Path Tester",
  description: "JSONPath 표현식으로 JSON 데이터 쿼리·실시간 결과 확인. 무료 온라인 JSON Path 테스터.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
