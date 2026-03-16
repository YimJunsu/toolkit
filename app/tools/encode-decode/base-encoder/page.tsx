"use client";

import { useState, useCallback, useMemo } from "react";
import { Binary, Copy, Check, ArrowLeftRight } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";
import { encodeBase32, decodeBase32, encodeBase58, decodeBase58 } from "@/lib/utils/encodeUtils";

type Encoding = "base32" | "base58" | "base64";
type Mode = "encode" | "decode";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Encode / Decode", href: "/tools/encode-decode" },
];

const ENCODING_LABELS: Record<Encoding, string> = {
  base32: "Base32",
  base58: "Base58",
  base64: "Base64",
};

function processText(input: string, encoding: Encoding, mode: Mode): string {
  if (mode === "encode") {
    switch (encoding) {
      case "base32": return encodeBase32(input);
      case "base58": return encodeBase58(input);
      case "base64": return btoa(unescape(encodeURIComponent(input)));
    }
  } else {
    switch (encoding) {
      case "base32": return decodeBase32(input);
      case "base58": return decodeBase58(input);
      case "base64": return decodeURIComponent(escape(atob(input.trim())));
    }
  }
}

export default function BaseEncoderPage() {
  const [encoding, setEncoding] = useState<Encoding>("base64");
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const { copied, copy } = useClipboard();

  // useMemo로 렌더 중 setState 호출 제거 → 무한 루프 방지
  const { output, error } = useMemo<{ output: string; error: string | null }>(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      return { output: processText(input, encoding, mode), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "변환 중 오류가 발생했습니다." };
    }
  }, [input, encoding, mode]);

  const handleSwap = useCallback(() => {
    setMode((prev) => (prev === "encode" ? "decode" : "encode"));
    setInput(output);
  }, [output]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    copy(output, "default");
  }, [output, copy]);

  const handleEncodingChange = (enc: Encoding) => {
    setEncoding(enc);
    setInput("");
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setInput("");
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Base 인코더 / 디코더"
      description="Base32 · Base58 · Base64 인코딩 및 디코딩을 즉시 변환합니다."
      icon={Binary}
    >
      <div className="flex flex-col gap-6">

        {/* 컨트롤 바 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 인코딩 선택 */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["base64", "base32", "base58"] as Encoding[]).map((enc) => (
              <button
                key={enc}
                type="button"
                onClick={() => handleEncodingChange(enc)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  encoding === enc
                    ? "bg-brand text-bg-primary"
                    : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                }`}
              >
                {ENCODING_LABELS[enc]}
              </button>
            ))}
          </div>

          {/* 모드 토글 */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["encode", "decode"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  mode === m
                    ? "bg-brand/20 text-brand"
                    : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                }`}
              >
                {m === "encode" ? "인코딩" : "디코딩"}
              </button>
            ))}
          </div>

          {/* 스왑 버튼 */}
          <button
            type="button"
            onClick={handleSwap}
            disabled={!output}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-40"
            title="결과를 입력으로 교체하고 모드 전환"
          >
            <ArrowLeftRight size={14} aria-hidden="true" />
            <span>스왑</span>
          </button>
        </div>

        {/* 인코딩 설명 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          {encoding === "base32" && (
            <span>
              <strong className="text-text-primary">Base32</strong> — RFC 4648 표준.
              대문자 A–Z, 숫자 2–7로 구성된 32개 문자 사용. 이메일, DNS 등에서 대소문자 구분 없이 안전하게 사용.
            </span>
          )}
          {encoding === "base58" && (
            <span>
              <strong className="text-text-primary">Base58</strong> — Bitcoin 주소 포맷.
              0, O, I, l 등 혼동하기 쉬운 문자를 제거한 58개 문자 사용. 지갑 주소, 단축 ID 등에 활용.
            </span>
          )}
          {encoding === "base64" && (
            <span>
              <strong className="text-text-primary">Base64</strong> — RFC 4648 표준.
              바이너리 데이터를 ASCII 텍스트로 인코딩. 이메일 첨부, JWT 토큰, 데이터 URI 등에서 폭넓게 사용.
            </span>
          )}
        </div>

        {/* 입출력 영역 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* 입력 */}
          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">
                {mode === "encode" ? "원본 텍스트" : `${ENCODING_LABELS[encoding]} 문자열`}
              </label>
              <button
                type="button"
                onClick={() => setInput("")}
                disabled={!input}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30"
              >
                지우기
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? "변환할 텍스트를 입력하세요..."
                  : `${ENCODING_LABELS[encoding]} 문자열을 붙여넣으세요...`
              }
              rows={10}
              className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 transition-colors focus:border-brand focus:outline-none"
              spellCheck={false}
            />
            <p className="text-right text-xs text-text-secondary">{input.length} 자</p>
          </div>

          {/* 출력 */}
          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">
                {mode === "encode" ? `${ENCODING_LABELS[encoding]} 결과` : "디코딩된 텍스트"}
              </label>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-40"
              >
                {copied === "default" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied === "default" ? "복사됨" : "복사"}
              </button>
            </div>
            <textarea
              readOnly
              value={error ? "" : output}
              placeholder="결과가 여기에 표시됩니다."
              rows={10}
              className={`w-full resize-none rounded-xl border p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 ${
                error ? "border-red-500/50 bg-bg-primary" : "border-border bg-bg-primary"
              }`}
              spellCheck={false}
            />
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <p className="text-right text-xs text-text-secondary">{output.length} 자</p>
            )}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}