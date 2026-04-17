import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "뽀모도로 타이머",
  description: "25분 집중·5분 휴식 사이클·원형 프로그레스·알림음. 무료 온라인 뽀모도로 타이머.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
