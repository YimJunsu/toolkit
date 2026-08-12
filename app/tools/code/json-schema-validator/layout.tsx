import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Schema Validator",
  description: "JSON 데이터를 Schema에 맞게 검증·오류 위치 표시. 무료 온라인 JSON Schema 검증 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
