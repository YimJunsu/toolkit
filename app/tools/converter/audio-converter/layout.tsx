import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오디오 변환기",
  description: "MP3·WAV·OGG 등 오디오를 WAV로 변환 및 미리보기. 무료 온라인 오디오 변환기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
