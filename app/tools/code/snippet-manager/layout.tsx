import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Snippet Manager",
  description: "코드 스니펫 저장·검색·복사 (로컬 저장소 기반). 무료 온라인 코드 스니펫 관리 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
