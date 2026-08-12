import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie / Session Viewer",
  description: "현재 페이지의 Cookie·localStorage·sessionStorage 조회. 무료 온라인 쿠키 뷰어.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
