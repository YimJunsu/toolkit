import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Picker",
  description: "HEX, RGB, HSL 색상 변환 및 시각화. 무료 온라인 컬러 피커.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
