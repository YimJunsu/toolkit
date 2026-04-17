import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "세금 계산기",
  description: "소득세·4대보험 계산기. 연봉 실수령액 계산. 무료 온라인 세금 계산기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
