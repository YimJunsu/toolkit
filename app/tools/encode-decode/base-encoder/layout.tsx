import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Base 인코더 / 디코더",
  description: "Base32·Base58·Base64 인코딩 및 디코딩. 무료 온라인 Base 인코더.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
