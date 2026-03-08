import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";
import { ENCODE_DECODE_TOOLS } from "@/lib/constants/tools";

export const metadata: Metadata = {
  title: "Encode / Decode 도구",
  description: "Base32, Base58, AES, RSA 암호화, URL 단축 등 인코딩·암호화 도구 모음",
};

export default function EncodeDecodeCategoryPage() {
  return (
    <div className="w-full px-4 py-10 md:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-start gap-4 border-b border-border pb-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Lock size={22} className="text-brand" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Encode / Decode</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Base32·Base58·Base64 인코딩, AES·RSA 암호화, URL 단축 등{" "}
            {ENCODE_DECODE_TOOLS.length}개의 도구
          </p>
        </div>
      </div>

      {/* 도구 카드 그리드 */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ENCODE_DECODE_TOOLS.map((tool) => (
          <li key={tool.id}>
            <ToolCard {...tool} />
          </li>
        ))}
      </ul>
    </div>
  );
}