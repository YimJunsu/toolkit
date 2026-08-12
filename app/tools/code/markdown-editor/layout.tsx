import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markdown Editor",
  description: "마크다운 실시간 미리보기·분할 화면 편집기. 무료 온라인 마크다운 에디터.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
