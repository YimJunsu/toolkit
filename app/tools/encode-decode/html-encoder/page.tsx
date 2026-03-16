"use client";

import { useState, useMemo, useCallback } from "react";
import { Code2, Copy, Check, ArrowLeftRight } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Encode / Decode", href: "/tools/encode-decode" },
];

type Mode = "encode" | "decode";

const HTML_ENTITIES: [RegExp, string][] = [
  [/&/g, "&amp;"],
  [/</g, "&lt;"],
  [/>/g, "&gt;"],
  [/"/g, "&quot;"],
  [/'/g, "&#39;"],
];

const HTML_ENTITIES_DECODE: [RegExp, string | ((...args: string[]) => string)][] = [
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&apos;/g, "'"],
  [/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code))],
  [/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))],
];

function encodeHtml(text: string): string {
  return HTML_ENTITIES.reduce((acc, [pattern, entity]) => acc.replace(pattern, entity), text);
}

function decodeHtml(text: string): string {
  return HTML_ENTITIES_DECODE.reduce(
    (acc, [pattern, replacement]) =>
      typeof replacement === "function"
        ? acc.replace(pattern, replacement)
        : acc.replace(pattern, replacement),
    text
  );
}

const EXAMPLES = [
  { label: "<script>", value: '<script>alert("XSS")</script>' },
  { label: "따옴표", value: 'He said "Hello" & \'World\'' },
  { label: "한글 태그", value: "<p>안녕하세요 & 감사합니다</p>" },
];

export default function HtmlEncoderPage() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const { copied, copy } = useClipboard();

  const output = useMemo(() => {
    if (!input) return "";
    return mode === "encode" ? encodeHtml(input) : decodeHtml(input);
  }, [input, mode]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    copy(output, "default");
  }, [output, copy]);

  const handleSwap = useCallback(() => {
    setMode((prev) => (prev === "encode" ? "decode" : "encode"));
    setInput(output);
  }, [output]);

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setInput("");
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="HTML 인코더 / 디코더"
      description="특수 문자를 HTML 엔티티로 변환하거나 다시 원본으로 복원합니다."
      icon={Code2}
    >
      <div className="flex flex-col gap-6">

        {/* 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">HTML 엔티티 인코딩</strong> — &amp;, &lt;, &gt;, &quot;, &#39; 등 특수 문자를 안전한 HTML 표현으로 변환합니다.
          XSS 방지, HTML 템플릿 작성에 유용합니다.
        </div>

        {/* 모드 선택 + 스왑 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["encode", "decode"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  mode === m
                    ? "bg-brand text-bg-primary"
                    : "text-text-secondary hover:bg-brand/10 hover:text-text-primary"
                }`}
              >
                {m === "encode" ? "인코딩" : "디코딩"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSwap}
            disabled={!output}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-40"
          >
            <ArrowLeftRight size={14} aria-hidden="true" />
            <span>스왑</span>
          </button>
        </div>

        {/* 예시 버튼 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-secondary">예시:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => { setMode("encode"); setInput(ex.value); }}
              className="rounded-lg border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* 입출력 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* 입력 */}
          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">
                {mode === "encode" ? "원본 텍스트" : "HTML 엔티티 문자열"}
              </label>
              <button
                type="button"
                onClick={() => setInput("")}
                disabled={!input}
                className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
              >
                지우기
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? '<p>Hello & "World"</p>'
                  : "&lt;p&gt;Hello &amp; &quot;World&quot;&lt;/p&gt;"
              }
              rows={12}
              className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none transition-colors"
              spellCheck={false}
            />
            <p className="text-right text-xs text-text-secondary">{input.length} 자</p>
          </div>

          {/* 출력 */}
          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">
                {mode === "encode" ? "HTML 엔티티 결과" : "디코딩된 텍스트"}
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
              value={output}
              placeholder="결과가 여기에 표시됩니다."
              rows={12}
              className="w-full resize-none rounded-xl border border-border bg-bg-primary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50"
              spellCheck={false}
            />
            <p className="text-right text-xs text-text-secondary">{output.length} 자</p>
          </div>
        </div>

        {/* 엔티티 참조표 */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-text-secondary">주요 HTML 엔티티</h3>
          <div className="overflow-hidden rounded-xl border border-border">
            {[
              { char: "&", entity: "&amp;" },
              { char: "<", entity: "&lt;" },
              { char: ">", entity: "&gt;" },
              { char: '"', entity: "&quot;" },
              { char: "'", entity: "&#39;" },
            ].map(({ char, entity }) => (
              <div key={char} className="flex items-center gap-4 border-b border-border px-4 py-2.5 last:border-b-0">
                <span className="w-12 font-mono text-sm font-bold text-text-primary">{char}</span>
                <span className="font-mono text-sm text-brand">{entity}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </ToolPageLayout>
  );
}