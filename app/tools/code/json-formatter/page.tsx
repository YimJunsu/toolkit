"use client";

import { useState, useMemo } from "react";
import { Braces, Copy, Check, AlertTriangle, Minimize2, Maximize2 } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

const SAMPLE_JSON = `{
  "name": "tool.kit",
  "version": "1.0.0",
  "features": ["formatter", "validator"],
  "meta": { "author": "dev", "year": 2025 }
}`;

type Mode = "format" | "minify";

export default function JsonFormatterPage() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const { copied, copy } = useClipboard();
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState(2);

  const result = useMemo<{ output: string; error: string | null }>(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      const parsed = JSON.parse(input);
      const output = mode === "format"
        ? JSON.stringify(parsed, null, indent)
        : JSON.stringify(parsed);
      return { output, error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "파싱 오류" };
    }
  }, [input, mode, indent]);

  const handleCopy = () => {
    if (!result.output) return;
    copy(result.output);
  };

  const isValid = !result.error && input.trim().length > 0;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="JSON Formatter / Validator"
      description="JSON을 보기 좋게 정렬하거나 최소화합니다. 문법 오류를 즉시 감지합니다."
      icon={Braces}
    >
      <div className="flex flex-col gap-4">
        {/* 옵션 바 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["format", "minify"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  mode === m
                    ? "bg-brand text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m === "format" ? <><Maximize2 size={12} className="inline mr-1" />Format</> : <><Minimize2 size={12} className="inline mr-1" />Minify</>}
              </button>
            ))}
          </div>

          {mode === "format" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">들여쓰기</span>
              {[2, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setIndent(n)}
                  className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                    indent === n
                      ? "border-brand text-brand"
                      : "border-border text-text-secondary hover:border-brand/50"
                  }`}
                >
                  {n} spaces
                </button>
              ))}
            </div>
          )}

          {/* 유효성 뱃지 */}
          {input.trim() && (
            <div className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              isValid
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/40 bg-red-500/10 text-red-400"
            }`}>
              {isValid ? "✓ Valid JSON" : <><AlertTriangle size={11} /> Invalid JSON</>}
            </div>
          )}
        </div>

        {/* 입출력 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 입력 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">입력</span>
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
              placeholder='{"key": "value"}'
              rows={18}
              spellCheck={false}
              className={`w-full resize-none rounded-xl border p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none transition-colors ${
                result.error
                  ? "border-red-500/50 bg-bg-secondary focus:border-red-500"
                  : "border-border bg-bg-secondary focus:border-brand"
              }`}
            />
            {result.error && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle size={12} />
                {result.error}
              </p>
            )}
          </div>

          {/* 출력 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">출력</span>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result.output}
                className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
            <pre className="h-full min-h-[18rem] overflow-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm leading-relaxed text-text-primary">
              {result.output || <span className="text-text-secondary/50">결과가 여기에 표시됩니다</span>}
            </pre>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}