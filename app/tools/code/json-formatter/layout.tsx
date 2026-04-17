import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Formatter / Validator",
  description: "JSON 포맷 정렬·최소화·유효성 검사. 오류 위치 즉시 표시. 무료 온라인 JSON 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
