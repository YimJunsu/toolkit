import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "퇴직금 계산기",
  description: "근속 기간·평균 임금으로 퇴직금을 즉시 계산. 무료 온라인 퇴직금 계산기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
