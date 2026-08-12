import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markdown HTML 변환기",
  description: "마크다운을 HTML로 실시간 변환·렌더링 미리보기·소스 복사. 무료 온라인 Markdown HTML 변환기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
