import type { Metadata } from "next";
import { CategoryPageLayout } from "@/components/tools/CategoryPageLayout";
import { ENCODE_DECODE_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Encode / Decode 도구",
  description: "Base32, Base58, AES, RSA 암호화, URL 단축 등 인코딩·암호화 도구 모음",
};

export default function EncodeDecodeCategoryPage() {
  return (
    <CategoryPageLayout
      categoryId="encode-decode"
      title="Encode / Decode"
      description="Base32·64 인코딩, AES·RSA 암호화, JWT 디코더, SHA 해시 생성 등 보안 도구"
      tools={ENCODE_DECODE_TOOLS}
    />
  );
}
