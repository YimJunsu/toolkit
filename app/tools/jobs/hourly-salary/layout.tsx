import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "시급 계산기",
  description: "시급·주급·월급 계산기. 최저임금 기준 실수령액 계산. 무료 온라인 시급 계산기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
