"use client";

import { useState, useMemo } from "react";
import { Code2, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Text", href: "/tools/text" },
];

const SAMPLE = "hello world foo bar";

/* ── 변환 함수 ── */
function tokenize(text: string): string[] {
  // camelCase / PascalCase 분리 포함
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_\-./]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function toCamel(text: string): string {
  const tokens = tokenize(text);
  return tokens.map((t, i) => i === 0 ? t.toLowerCase() : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join("");
}

function toPascal(text: string): string {
  return tokenize(text).map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join("");
}

function toSnake(text: string): string {
  return tokenize(text).map((t) => t.toLowerCase()).join("_");
}

function toScreamingSnake(text: string): string {
  return tokenize(text).map((t) => t.toUpperCase()).join("_");
}

function toKebab(text: string): string {
  return tokenize(text).map((t) => t.toLowerCase()).join("-");
}

function toCobol(text: string): string {
  return tokenize(text).map((t) => t.toUpperCase()).join("-");
}

function toDot(text: string): string {
  return tokenize(text).map((t) => t.toLowerCase()).join(".");
}

function toTitle(text: string): string {
  return tokenize(text).map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(" ");
}

function toSentence(text: string): string {
  const joined = tokenize(text).join(" ").toLowerCase();
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

function toUpper(text: string): string {
  return text.toUpperCase();
}

function toLower(text: string): string {
  return text.toLowerCase();
}

function toAlternating(text: string): string {
  return text.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
}

const CASES = [
  { id: "camel", label: "camelCase", fn: toCamel, example: "helloWorldFoo" },
  { id: "pascal", label: "PascalCase", fn: toPascal, example: "HelloWorldFoo" },
  { id: "snake", label: "snake_case", fn: toSnake, example: "hello_world_foo" },
  { id: "screaming", label: "SCREAMING_SNAKE", fn: toScreamingSnake, example: "HELLO_WORLD_FOO" },
  { id: "kebab", label: "kebab-case", fn: toKebab, example: "hello-world-foo" },
  { id: "cobol", label: "COBOL-CASE", fn: toCobol, example: "HELLO-WORLD-FOO" },
  { id: "dot", label: "dot.case", fn: toDot, example: "hello.world.foo" },
  { id: "title", label: "Title Case", fn: toTitle, example: "Hello World Foo" },
  { id: "sentence", label: "Sentence case", fn: toSentence, example: "Hello world foo" },
  { id: "upper", label: "UPPERCASE", fn: toUpper, example: "HELLO WORLD FOO" },
  { id: "lower", label: "lowercase", fn: toLower, example: "hello world foo" },
  { id: "alternating", label: "aLtErNaTiNg", fn: toAlternating, example: "hElLo WoRlD" },
] as const;

export default function CaseConverterPage() {
  const [input, setInput] = useState(SAMPLE);
  const { copied: copiedId, copy } = useClipboard();

  const results = useMemo(
    () => CASES.map((c) => ({ ...c, output: input ? c.fn(input) : "" })),
    [input]
  );

  const handleCopy = (id: string, text: string) => {
    copy(text, id);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Case Converter"
      description="텍스트를 camelCase · snake_case · PascalCase · kebab-case 등 다양한 형식으로 즉시 변환합니다."
      icon={Code2}
    >
      <div className="flex flex-col gap-5">
        {/* 입력 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary">입력 텍스트</label>
            <button
              type="button"
              onClick={() => setInput("")}
              disabled={!input}
              className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
            >
              지우기
            </button>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="변환할 텍스트 입력..."
            className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
          <p className="text-xs text-text-secondary">
            camelCase, snake_case, kebab-case 등 다양한 형식을 자동으로 인식하여 분리합니다.
          </p>
        </div>

        {/* 변환 결과 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(({ id, label, output }) => (
            <div
              key={id}
              className="flex flex-col gap-1.5 rounded-xl border border-border bg-bg-secondary p-4"
            >
              <span className="text-xs font-semibold text-text-secondary">{label}</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-bg-primary px-3 py-2 font-mono text-sm text-text-primary">
                  {output || <span className="opacity-40">—</span>}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(id, output)}
                  disabled={!output}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30"
                  aria-label="복사"
                >
                  {copiedId === id
                    ? <Check size={13} className="text-emerald-400" />
                    : <Copy size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
}