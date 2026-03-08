import { permanentRedirect } from "next/navigation";

// 이미지 변환기가 Converter 카테고리로 이동했습니다.
export default function ImageOptimizerRedirectPage() {
  permanentRedirect("/tools/converter/image-converter");
}