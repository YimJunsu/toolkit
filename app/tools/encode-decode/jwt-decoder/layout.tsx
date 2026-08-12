import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JWT 디코더",
  description: "JWT 토큰 Header·Payload·만료 시간 즉시 디코딩. 무료 온라인 JWT 디코더.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
