import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hash 생성기",
  description: "SHA-256·SHA-1·SHA-512 해시를 HEX·Base64로 즉시 계산. 무료 온라인 해시 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
