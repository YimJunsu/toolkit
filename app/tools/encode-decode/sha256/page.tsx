"use client";

import { useState, useEffect, useCallback } from "react";
import { Hash, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { md5 } from "@/lib/utils/hashUtils";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Encode / Decode", href: "/tools/encode-decode" },
];

type Algorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

const ALGO_OPTIONS: { value: Algorithm; label: string; bits: string; desc: string }[] = [
  { value: "MD5",     label: "MD5",     bits: "128 bit", desc: "레거시 시스템 호환용. 충돌 취약점이 발견되어 보안 목적에는 사용 금지. 체크섬 등 무결성 확인에만 활용." },
  { value: "SHA-1",   label: "SHA-1",   bits: "160 bit", desc: "레거시 시스템 호환용. 보안 취약점이 발견되어 새 시스템에는 권장하지 않음." },
  { value: "SHA-256", label: "SHA-256", bits: "256 bit", desc: "현재 가장 범용적으로 사용되는 표준 해시. JWT, TLS, 코드 서명 등에 사용." },
  { value: "SHA-512", label: "SHA-512", bits: "512 bit", desc: "SHA-256보다 강력한 해시. 64비트 시스템에서 성능 우위." },
];

function hexToBase64(hex: string): string {
  const bytes = hex.match(/../g)!.map((b) => parseInt(b, 16));
  return btoa(String.fromCharCode(...bytes));
}

async function computeHash(text: string, algo: Algorithm): Promise<{ hex: string; b64: string; byteLen: number }> {
  if (algo === "MD5") {
    const hex = md5(text);
    return { hex, b64: hexToBase64(hex), byteLen: 16 };
  }
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  const arr = new Uint8Array(buf);
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  const b64 = btoa(String.fromCharCode(...arr));
  return { hex, b64, byteLen: arr.length };
}

export default function HashGeneratorPage() {
  const [input, setInput]   = useState("");
  const [algo, setAlgo]     = useState<Algorithm>("SHA-256");
  const [hex, setHex]       = useState("");
  const [b64, setB64]       = useState("");
  const [byteLen, setByteLen] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!input) {
      setHex("");
      setB64("");
      setByteLen(0);
      return;
    }
    let cancelled = false;
    computeHash(input, algo).then((result) => {
      if (cancelled) return;
      setHex(result.hex);
      setB64(result.b64);
      setByteLen(result.byteLen);
    });
    return () => { cancelled = true; };
  }, [input, algo]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const inputBytes = new TextEncoder().encode(input).length;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Hash 생성기"
      description="입력 텍스트의 MD5 · SHA-1 · SHA-256 · SHA-512 해시를 HEX 및 Base64로 즉시 계산합니다."
      icon={Hash}
    >
      <div className="flex flex-col gap-6">

        {/* 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">단방향 해시 함수</strong> — 동일한 입력은 항상 동일한 해시를 출력합니다.
          해시는 복호화가 불가능합니다. 비밀번호 검증, 파일 무결성 확인, 디지털 서명 등에 활용됩니다.
        </div>

        {/* 알고리즘 선택 */}
        <div className="flex overflow-hidden rounded-lg border border-border w-fit">
          {ALGO_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setAlgo(value)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                algo === value
                  ? "bg-brand text-bg-primary"
                  : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 입력 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary">입력 텍스트</label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary">{inputBytes} bytes</span>
              <button
                type="button"
                onClick={() => setInput("")}
                disabled={!input}
                className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
              >
                지우기
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="해시를 계산할 텍스트를 입력하세요..."
            rows={6}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none transition-colors"
            spellCheck={false}
          />
        </div>

        {/* 해시 결과 */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text-primary">
            {ALGO_OPTIONS.find((a) => a.value === algo)?.label} 해시 결과
          </h3>

          <div className="overflow-hidden rounded-xl border border-border">
            {[
              { label: "HEX (16진수)", value: hex, id: "hex" },
              { label: "Base64",       value: b64, id: "b64" },
            ].map(({ label, value, id }) => (
              <div key={id} className="flex items-center gap-3 border-b border-border last:border-b-0 px-4 py-3">
                <span className="w-24 shrink-0 text-xs font-semibold text-text-secondary">{label}</span>
                <span className="flex-1 break-all font-mono text-xs text-text-primary min-w-0">
                  {value || <span className="text-text-secondary/40">—</span>}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(value, id)}
                  disabled={!value}
                  className="flex shrink-0 items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30"
                >
                  {copied === id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            ))}
          </div>

          {/* 알고리즘 메타 */}
          {hex && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "알고리즘",    value: algo },
                { label: "출력 길이",   value: `${byteLen * 8} bit / ${byteLen} byte` },
                { label: "HEX 길이",   value: `${hex.length} 자` },
                { label: "Base64 길이", value: `${b64.length} 자` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-center">
                  <p className="text-xs text-text-secondary">{label}</p>
                  <p className="mt-0.5 font-mono text-xs font-semibold text-text-primary">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 알고리즘 설명 */}
        <div className="overflow-hidden rounded-xl border border-border">
          {ALGO_OPTIONS.map(({ value, label, bits, desc }) => (
            <div
              key={value}
              className={`flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0 ${algo === value ? "bg-brand/5" : ""}`}
            >
              <span className={`w-20 shrink-0 font-mono text-xs font-semibold ${algo === value ? "text-brand" : "text-text-secondary"}`}>
                {label}
              </span>
              <span className="text-xs text-text-secondary">
                <span className="text-text-primary font-medium">{bits}</span> — {desc}
              </span>
            </div>
          ))}
        </div>

      </div>
    </ToolPageLayout>
  );
}