import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HTTP Status Code Reference",
  description: "HTTP 상태 코드 레퍼런스·코드별 설명 및 용도 정리. 개발자를 위한 HTTP 상태 코드 사전.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
