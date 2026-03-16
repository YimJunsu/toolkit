"use client";

import { useState, useMemo } from "react";
import { PenTool, Copy, Check, RotateCcw, Minimize2 } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="#818cf8" opacity="0.8" />
  <rect x="30" y="30" width="40" height="40" fill="none" stroke="#ffffff" stroke-width="2" rx="4" />
  <path d="M 35 50 L 50 35 L 65 50 L 50 65 Z" fill="#ffffff" opacity="0.6" />
</svg>`;

/* 기본 SVG 최적화 (라이브러리 없이) */
function minifySvg(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")           // 주석 제거
    .replace(/>\s+</g, "><")                    // 태그 사이 공백
    .replace(/\s{2,}/g, " ")                    // 연속 공백 → 단일
    .replace(/\n/g, "")                         // 줄바꿈 제거
    .replace(/\s*([{};:,>~+])\s*/g, "$1")      // 연산자 주변 공백
    .replace(/="([^"]*?)"/g, (_, v) => `="${v.trim()}"`) // 속성값 공백 trim
    .trim();
}

/* 소수점 자릿수 정리 (path d 속성 내 숫자) */
function roundPathNumbers(input: string, decimals = 2): string {
  return input.replace(/(-?\d+\.\d{3,})/g, (match) => {
    return parseFloat(match).toFixed(decimals).replace(/\.?0+$/, "");
  });
}

/* 기본 포매팅 */
function prettifySvg(input: string): string {
  let depth = 0;
  const lines: string[] = [];
  // 태그 단위로 분리
  const tokens = input
    .replace(/>\s*</g, ">\n<")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const token of tokens) {
    if (/^<\//.test(token)) {
      depth = Math.max(0, depth - 1);
      lines.push("  ".repeat(depth) + token);
    } else if (/\/>$/.test(token) || /^<!/.test(token)) {
      lines.push("  ".repeat(depth) + token);
    } else if (/^<[^?!]/.test(token)) {
      lines.push("  ".repeat(depth) + token);
      depth++;
    } else {
      lines.push("  ".repeat(depth) + token);
    }
  }
  return lines.join("\n");
}

/* SVG 기본 통계 */
function analyzeSvg(input: string) {
  const tagMatches  = input.match(/<[a-zA-Z][^>]*>/g) ?? [];
  const pathMatches = input.match(/<path/g) ?? [];
  const bytes       = new TextEncoder().encode(input).length;
  return { tags: tagMatches.length, paths: pathMatches.length, bytes };
}

export default function SvgEditorPage() {
  const [input,    setInput]    = useState(SAMPLE_SVG);
  const [decimals, setDecimals] = useState(2);
  const { copied, copy } = useClipboard();

  const minified  = useMemo(() => minifySvg(roundPathNumbers(input, decimals)), [input, decimals]);
  const prettified = useMemo(() => prettifySvg(input), [input]);
  const stats      = useMemo(() => analyzeSvg(input), [input]);
  const minStats   = useMemo(() => analyzeSvg(minified), [minified]);
  const savings    = stats.bytes > 0 ? Math.round((1 - minStats.bytes / stats.bytes) * 100) : 0;

  // SVG 프리뷰 (DOMParser로 파싱 가능 여부)
  const previewSafe = input.trim().startsWith("<svg") && input.includes("</svg>");

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="SVG Path Editor"
      description="SVG 코드를 최적화·미니파이·포매팅합니다. 소수점 정리, 주석 제거, 공백 압축을 지원합니다."
      icon={PenTool}
    >
      <div className="flex flex-col gap-6">

        {/* ── 도구 버튼 & 옵션 ── */}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setInput(prettifySvg(input))}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
            포매팅 (Prettify)
          </button>
          <button type="button" onClick={() => setInput(roundPathNumbers(input, decimals))}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
            <Minimize2 size={12} /> 소수점 정리
          </button>
          <button type="button" onClick={() => setInput(SAMPLE_SVG)}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
            <RotateCcw size={12} /> 샘플로 초기화
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-secondary">소수점</span>
            {[1, 2, 3].map((d) => (
              <button key={d} type="button" onClick={() => setDecimals(d)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  decimals === d ? "border-brand bg-brand/10 text-brand" : "border-border text-text-secondary hover:border-brand/40"
                }`}>
                .{d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ── 입력 ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary">SVG 코드 입력</p>
              <span className="text-xs text-text-secondary">{stats.bytes.toLocaleString()} bytes · 태그 {stats.tags}개</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              className="h-64 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 font-mono text-xs leading-relaxed text-text-primary focus:border-brand focus:outline-none resize-y"
              placeholder={SAMPLE_SVG}
            />
          </div>

          {/* ── 프리뷰 ── */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-text-secondary">미리보기</p>
            <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-bg-secondary">
              {previewSafe ? (
                <div
                  className="max-h-full max-w-full p-4"
                  /* biome-ignore lint/security/noDangerouslySetInnerHtml */
                  dangerouslySetInnerHTML={{ __html: input }}
                />
              ) : (
                <p className="text-sm text-text-secondary">유효한 SVG 코드를 입력하세요</p>
              )}
            </div>
          </div>
        </div>

        {/* ── 최적화 결과 ── */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-bg-secondary px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-text-primary">최적화된 SVG</span>
              {savings > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                  -{savings}% ({(stats.bytes - minStats.bytes).toLocaleString()} bytes 절약)
                </span>
              )}
            </div>
            <button type="button" onClick={() => copy(minified, "minified")}
              className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-brand">
              {copied === "minified" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              복사
            </button>
          </div>
          <textarea
            readOnly
            value={minified}
            className="h-32 w-full bg-transparent px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary focus:outline-none resize-none"
          />
        </div>

        {/* ── 포매팅 결과 ── */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-bg-secondary px-4 py-2.5">
            <span className="text-xs font-semibold text-text-primary">포매팅된 SVG</span>
            <button type="button" onClick={() => copy(prettified, "prettified")}
              className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-brand">
              {copied === "prettified" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              복사
            </button>
          </div>
          <textarea
            readOnly
            value={prettified}
            className="h-48 w-full bg-transparent px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary focus:outline-none resize-none"
          />
        </div>
      </div>
    </ToolPageLayout>
  );
}