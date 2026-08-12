import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SQL Formatter",
  description: "SQL 쿼리 자동 정렬·키워드 대문자 변환·복사. 무료 온라인 SQL 포매터.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
