import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회계 계산기",
  description: "세금 계산·단가 변환·퇴직금 산정·직장인·프리랜서·자영업자 통합 재무 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
