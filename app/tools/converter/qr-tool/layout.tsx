import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR 코드 도구",
  description: "URL에서 QR 코드 생성 및 QR 이미지/카메라 스캔. 무료 온라인 QR 코드 생성기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
