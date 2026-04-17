import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "URL 단축기",
  description: "긴 URL을 짧은 링크로 즉시 변환. 무료 온라인 URL 단축 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
