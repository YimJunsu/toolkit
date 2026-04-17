import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Excel 변환기",
  description: "XLSX·XLS·CSV 파일을 JSON 또는 CSV로 변환 및 테이블 미리보기. 무료 온라인 엑셀 변환기.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
