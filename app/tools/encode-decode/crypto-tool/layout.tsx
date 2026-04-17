import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "암호화 / 복호화",
  description: "AES-256 대칭 암호화·RSA-2048 비대칭 암호화 테스트. 무료 온라인 암호화 도구.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
