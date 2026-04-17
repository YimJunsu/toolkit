import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공인 IP 조회",
  description: "현재 접속 중인 공인 IP 주소 및 위치 정보 즉시 조회. 무료 온라인 IP 주소 조회 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
