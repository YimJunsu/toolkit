"use client";

import { useState, useMemo } from "react";
import { BookOpen, Copy, Check } from "lucide-react";
import { marked } from "marked";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

const SAMPLE_MD = `# Markdown Editor

**tool.kit** 마크다운 에디터에 오신 것을 환영합니다!

## 기능

- 실시간 미리보기
- GitHub Flavored Markdown 지원
- 코드 하이라이트

## 코드 예시

\`\`\`typescript
const greet = (name: string) => {
  console.log(\`Hello, \${name}!\`);
};
\`\`\`

## 표 예시

| 이름 | 역할 |
|------|------|
| Alice | 개발자 |
| Bob | 디자이너 |

> 인용구 예시입니다.

---

[링크 예시](https://example.com)
`;

marked.setOptions({ breaks: true, gfm: true });

type ViewMode = "split" | "edit" | "preview";

export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState(SAMPLE_MD);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => {
    const result = marked.parse(markdown);
    return typeof result === "string" ? result : "";
  }, [markdown]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Markdown Editor"
      description="마크다운을 작성하고 실시간으로 HTML 미리보기를 확인합니다."
      icon={BookOpen}
    >
      <div className="flex flex-col gap-4">
        {/* 뷰 토글 */}
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["split", "edit", "preview"] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewMode(v)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  viewMode === v ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {v === "split" ? "분할" : v === "edit" ? "편집" : "미리보기"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="ml-auto flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "복사됨" : "MD 복사"}
          </button>
        </div>

        {/* 편집기 */}
        <div className={`grid gap-4 ${viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {(viewMode === "split" || viewMode === "edit") && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-text-secondary">마크다운</span>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                rows={viewMode === "split" ? 28 : 32}
                spellCheck={false}
                className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
              />
            </div>
          )}

          {(viewMode === "split" || viewMode === "preview") && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-text-secondary">미리보기</span>
              <div
                className="prose prose-invert min-h-[28rem] max-w-none overflow-auto rounded-xl border border-border bg-bg-secondary p-6 text-sm text-text-primary"
                style={{
                  "--tw-prose-body": "var(--color-text-primary)",
                  "--tw-prose-headings": "var(--color-text-primary)",
                  "--tw-prose-code": "var(--color-brand)",
                  "--tw-prose-pre-bg": "var(--color-bg-primary)",
                } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          )}
        </div>

        {/* prose 스타일 */}
        <style>{`
          .prose h1, .prose h2, .prose h3 { color: var(--color-text-primary); font-weight: 700; margin: 1em 0 0.5em; }
          .prose h1 { font-size: 1.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; }
          .prose h2 { font-size: 1.25rem; }
          .prose h3 { font-size: 1.1rem; }
          .prose p { color: var(--color-text-primary); margin: 0.75em 0; line-height: 1.7; }
          .prose strong { color: var(--color-text-primary); font-weight: 600; }
          .prose em { color: var(--color-text-secondary); }
          .prose code { color: var(--color-brand); background: rgba(129,140,248,0.12); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.875em; }
          .prose pre { background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 1rem; overflow-x: auto; }
          .prose pre code { background: none; padding: 0; color: var(--color-text-primary); }
          .prose ul, .prose ol { color: var(--color-text-primary); padding-left: 1.5rem; margin: 0.75em 0; }
          .prose li { margin: 0.25em 0; }
          .prose blockquote { border-left: 3px solid var(--color-brand); margin: 1em 0; padding-left: 1rem; color: var(--color-text-secondary); }
          .prose hr { border-color: var(--color-border); margin: 1.5em 0; }
          .prose a { color: var(--color-brand); text-decoration: underline; }
          .prose table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.875rem; }
          .prose th, .prose td { border: 1px solid var(--color-border); padding: 0.5rem 0.75rem; text-align: left; }
          .prose th { background: var(--color-bg-primary); font-weight: 600; color: var(--color-text-primary); }
          .prose td { color: var(--color-text-primary); }
        `}</style>
      </div>
    </ToolPageLayout>
  );
}