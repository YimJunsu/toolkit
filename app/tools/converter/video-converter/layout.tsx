import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "비디오 압축기",
  description: "MP4·WebM 해상도·화질 압축 및 WebM 포맷 변환. 무료 온라인 비디오 압축기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
