"use client";

import { useState, useMemo } from "react";
import { Table2, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

const SAMPLE_SQL = `SELECT u.id, u.name, u.email, o.total FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.active = 1 AND o.created_at > '2024-01-01' ORDER BY o.total DESC LIMIT 10;`;

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN",
  "OUTER JOIN", "FULL JOIN", "CROSS JOIN", "ON", "AND", "OR", "NOT", "IN",
  "EXISTS", "BETWEEN", "LIKE", "IS NULL", "IS NOT NULL", "ORDER BY", "GROUP BY",
  "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES", "UPDATE", "SET",
  "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "DISTINCT",
  "AS", "UNION", "UNION ALL", "INTERSECT", "EXCEPT", "WITH", "CASE",
  "WHEN", "THEN", "ELSE", "END", "INDEX", "PRIMARY KEY", "FOREIGN KEY",
  "REFERENCES", "CONSTRAINT", "DEFAULT", "NOT NULL", "UNIQUE",
];

const NEWLINE_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN",
  "OUTER JOIN", "FULL JOIN", "CROSS JOIN", "JOIN", "ON", "ORDER BY",
  "GROUP BY", "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES",
  "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "UNION",
  "UNION ALL", "WITH",
];

function formatSQL(sql: string, indent: number): string {
  let result = sql.trim();

  // 키워드 대문자
  const sorted = [...SQL_KEYWORDS].sort((a, b) => b.length - a.length);
  for (const kw of sorted) {
    const re = new RegExp(`\\b${kw.replace(/ /g, "\\s+")}\\b`, "gi");
    result = result.replace(re, kw);
  }

  // 쉼표 뒤 줄바꿈
  result = result.replace(/,\s*/g, `,\n${" ".repeat(indent)}`);

  // 주요 키워드 앞 줄바꿈
  const nlSorted = [...NEWLINE_KEYWORDS].sort((a, b) => b.length - a.length);
  for (const kw of nlSorted) {
    const re = new RegExp(`\\s+\\b(${kw.replace(/ /g, "\\s+")})\\b`, "g");
    result = result.replace(re, `\n${kw}`);
  }

  // 괄호 처리
  result = result
    .replace(/\(\s*/g, "(\n" + " ".repeat(indent))
    .replace(/\s*\)/g, "\n)");

  // 연속 공백 정리
  result = result.replace(/[ \t]+/g, " ").trim();

  // 줄 앞뒤 정리
  result = result.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim()).join("\n");

  return result;
}

export default function SqlFormatterPage() {
  const [input, setInput] = useState(SAMPLE_SQL);
  const { copied, copy } = useClipboard();
  const [indent, setIndent] = useState(2);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    return formatSQL(input, indent);
  }, [input, indent]);

  const handleCopy = () => {
    if (!output) return;
    copy(output);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="SQL Formatter"
      description="SQL 쿼리를 보기 좋게 정렬하고 키워드를 대문자로 변환합니다."
      icon={Table2}
    >
      <div className="flex flex-col gap-4">
        {/* 옵션 */}
        <div className="flex items-center gap-3">
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 입력 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">SQL 입력</span>
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
              placeholder="SELECT * FROM users WHERE id = 1;"
              rows={18}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
          </div>

          {/* 출력 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">포맷 결과</span>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
            <pre className="h-full min-h-[18rem] overflow-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm leading-relaxed text-text-primary">
              {output || <span className="text-text-secondary/50">SQL을 입력하면 결과가 표시됩니다</span>}
            </pre>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}