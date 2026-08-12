import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meta Tag Preview",
  description: "Google 검색 결과 스니펫 미리보기. 무료 온라인 메타 태그 미리보기 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
