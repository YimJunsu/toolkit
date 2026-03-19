"use client";

import { useState, useMemo, useCallback } from "react";
import { FileCode, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Converter", href: "/tools/converter" },
];

const SAMPLE_MD = `# Markdown HTML Converter

**toolkit**은 개발자를 위한 *종합 도구* 모음입니다.

## 기능 목록

- 실시간 변환
- **굵게**, *기울임*, ~~취소선~~
- \`인라인 코드\`

## 코드 블록

\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## 테이블

| 이름 | 역할 |
|------|------|
| Alice | 개발자 |
| Bob | 디자이너 |

## 인용구

> 좋은 도구는 생산성을 10배 높인다.

---

[toolkit 바로가기](https://toolkit.example.com)
`;

// ────── Markdown Parser ──────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseInline(text: string): string {
  return text
    // ~~strikethrough~~
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // **bold**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // __bold__
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    // *italic*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // _italic_
    .replace(/_(.+?)_/g, "<em>$1</em>")
    // `inline code`
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // ![img](url)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // [link](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block ```
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      output.push(
        `<pre><code${lang ? ` class="language-${lang}"` : ""}>${codeLines.join("\n")}</code></pre>`
      );
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      output.push(`<h${level}>${parseInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      output.push("<hr />");
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      output.push(`<blockquote>${parseInline(quoteLines.join(" "))}</blockquote>`);
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && /^\|?[\s:-]+\|/.test(lines[i + 1])) {
      const headerCells = line
        .split("|")
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map((c) => `<th>${parseInline(c.trim())}</th>`);
      i += 2; // skip separator
      const rows: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i]
          .split("|")
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map((c) => `<td>${parseInline(c.trim())}</td>`);
        rows.push(`<tr>${cells.join("")}</tr>`);
        i++;
      }
      output.push(
        `<table><thead><tr>${headerCells.join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`
      );
      continue;
    }

    // Unordered list
    if (/^[\-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-*+]\s/.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].replace(/^[\-*+]\s/, ""))}</li>`);
        i++;
      }
      output.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].replace(/^\d+\.\s/, ""))}</li>`);
        i++;
      }
      output.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith(">") && !/^[\-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) && !lines[i].includes("|")) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      output.push(`<p>${parseInline(paraLines.join(" "))}</p>`);
    } else {
      i++;
    }
  }

  return output.join("\n");
}

// ────── Page ──────

export default function MarkdownHtmlPage() {
  const [markdown, setMarkdown] = useState(SAMPLE_MD);
  const [tab, setTab] = useState<"html" | "preview">("preview");
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  const charCount = markdown.length;
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Markdown → HTML"
      description="Markdown을 실시간으로 HTML로 변환합니다. 파서를 직접 구현하여 외부 의존성이 없습니다."
      icon={FileCode}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 입력 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Markdown 입력</span>
            <span className="text-xs text-text-secondary">
              {charCount.toLocaleString()}자 · {wordCount.toLocaleString()}단어
            </span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Markdown을 입력하세요..."
            rows={28}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>

        {/* 출력 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {/* 탭 */}
            <div className="flex gap-1 rounded-lg border border-border bg-bg-secondary p-0.5">
              {(["preview", "html"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    tab === t
                      ? "bg-bg-primary text-text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {t === "preview" ? "미리보기" : "HTML 소스"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
            >
              {copied ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
              {copied ? "복사됨" : "HTML 복사"}
            </button>
          </div>

          {tab === "html" ? (
            <textarea
              readOnly
              value={html}
              rows={28}
              className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary focus:outline-none"
            />
          ) : (
            <div
              className="prose prose-sm h-full min-h-[28rem] overflow-auto rounded-xl border border-border bg-bg-secondary p-6 text-text-primary"
              style={{ maxWidth: "none" }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
}
