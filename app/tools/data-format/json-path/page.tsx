"use client";

import { useState, useCallback } from "react";
import { Filter, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Data", href: "/tools/data-format" },
];

const SAMPLE_JSON = `{
  "store": {
    "book": [
      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },
      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 },
      { "category": "fiction", "author": "Herman Melville", "title": "Moby Dick", "price": 8.99 },
      { "category": "fiction", "author": "J. R. R. Tolkien", "title": "The Lord of the Rings", "price": 22.99 }
    ],
    "bicycle": { "color": "red", "price": 19.95 }
  }
}`;

const EXAMPLES = [
  { label: "$.store.book[*].title", desc: "모든 책 제목" },
  { label: "$.store.book[0]", desc: "첫 번째 책" },
  { label: "$.store.book[-1]", desc: "마지막 책" },
  { label: "$..price", desc: "모든 price 재귀 탐색" },
  { label: "$.store.book[?(@.price < 10)]", desc: "10달러 미만 책" },
  { label: "$.store.bicycle.color", desc: "자전거 색상" },
  { label: "$.store.book[*].author", desc: "모든 저자" },
];

const SYNTAX_REF = [
  { expr: "$", desc: "루트 객체" },
  { expr: ".key", desc: "자식 프로퍼티 접근" },
  { expr: "['key']", desc: "브라켓 표기 프로퍼티 접근" },
  { expr: "[*]", desc: "모든 자식 요소 (와일드카드)" },
  { expr: "[0]", desc: "인덱스 접근 (0부터 시작)" },
  { expr: "[-1]", desc: "역방향 인덱스 (마지막)" },
  { expr: "..key", desc: "재귀 하강 (모든 레벨)" },
  { expr: "[?(@.key)]", desc: "필터: 해당 키 존재 여부" },
  { expr: "[?(@.key > 5)]", desc: "필터: 비교 연산자 (>, <, >=, <=, ==, !=)" },
];

// ────── JSONPath Evaluator ──────

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

function getAll(obj: JSONValue, key: string): JSONValue[] {
  const results: JSONValue[] = [];
  if (obj === null || typeof obj !== "object") return results;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      results.push(...getAll(item, key));
    }
  } else {
    if (key in obj) results.push((obj as Record<string, JSONValue>)[key]);
    for (const v of Object.values(obj)) {
      results.push(...getAll(v, key));
    }
  }
  return results;
}

function evaluateFilter(items: JSONValue[], filterExpr: string): JSONValue[] {
  // @.key op value
  const match = filterExpr.match(/^@\.(\w+)\s*(>|<|>=|<=|==|!=)\s*(.+)$/);
  if (match) {
    const [, key, op, rawVal] = match;
    let val: JSONValue;
    try { val = JSON.parse(rawVal); } catch { val = rawVal.replace(/['"]/g, ""); }
    return items.filter((item) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
      const itemVal = (item as Record<string, JSONValue>)[key];
      if (itemVal === undefined) return false;
      switch (op) {
        case ">": return (itemVal as number) > (val as number);
        case "<": return (itemVal as number) < (val as number);
        case ">=": return (itemVal as number) >= (val as number);
        case "<=": return (itemVal as number) <= (val as number);
        case "==": return itemVal === val;
        case "!=": return itemVal !== val;
        default: return false;
      }
    });
  }
  // @.key existence
  const existMatch = filterExpr.match(/^@\.(\w+)$/);
  if (existMatch) {
    return items.filter((item) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
      return existMatch[1] in (item as Record<string, JSONValue>);
    });
  }
  return items;
}

function evaluatePath(root: JSONValue, path: string): JSONValue[] {
  // Tokenize
  const tokens: string[] = [];
  let rest = path.trim();
  if (rest.startsWith("$")) rest = rest.slice(1);

  while (rest.length > 0) {
    if (rest.startsWith("..")) {
      const keyMatch = rest.slice(2).match(/^(\w+)/);
      if (keyMatch) {
        tokens.push(`..${keyMatch[1]}`);
        rest = rest.slice(2 + keyMatch[1].length);
      } else {
        rest = rest.slice(2);
      }
    } else if (rest.startsWith(".")) {
      rest = rest.slice(1);
      if (rest.startsWith("[")) continue;
      const keyMatch = rest.match(/^(\w+)/);
      if (keyMatch) {
        tokens.push(keyMatch[1]);
        rest = rest.slice(keyMatch[1].length);
      }
    } else if (rest.startsWith("[")) {
      const end = rest.indexOf("]");
      if (end === -1) break;
      tokens.push(rest.slice(0, end + 1));
      rest = rest.slice(end + 1);
    } else {
      const keyMatch = rest.match(/^(\w+)/);
      if (keyMatch) {
        tokens.push(keyMatch[1]);
        rest = rest.slice(keyMatch[1].length);
      } else {
        rest = rest.slice(1);
      }
    }
  }

  let current: JSONValue[] = [root];

  for (const token of tokens) {
    if (token.startsWith("..")) {
      const key = token.slice(2);
      current = current.flatMap((c) => getAll(c, key));
    } else if (token.startsWith("[") && token.endsWith("]")) {
      const inner = token.slice(1, -1).trim();
      if (inner === "*") {
        current = current.flatMap((c) => {
          if (Array.isArray(c)) return c;
          if (c && typeof c === "object") return Object.values(c as Record<string, JSONValue>);
          return [];
        });
      } else if (inner.startsWith("?")) {
        const filterStr = inner.slice(1).trim().replace(/^\(/, "").replace(/\)$/, "");
        current = current.flatMap((c) => {
          if (Array.isArray(c)) return evaluateFilter(c, filterStr);
          return [];
        });
      } else if (inner.startsWith("'") || inner.startsWith('"')) {
        const key = inner.slice(1, -1);
        current = current.flatMap((c) => {
          if (c && typeof c === "object" && !Array.isArray(c)) {
            const v = (c as Record<string, JSONValue>)[key];
            return v !== undefined ? [v] : [];
          }
          return [];
        });
      } else {
        const idx = parseInt(inner, 10);
        current = current.flatMap((c) => {
          if (Array.isArray(c)) {
            const realIdx = idx < 0 ? c.length + idx : idx;
            return realIdx >= 0 && realIdx < c.length ? [c[realIdx]] : [];
          }
          return [];
        });
      }
    } else {
      current = current.flatMap((c) => {
        if (c && typeof c === "object" && !Array.isArray(c)) {
          const v = (c as Record<string, JSONValue>)[token];
          return v !== undefined ? [v] : [];
        }
        return [];
      });
    }
  }

  return current;
}

// ────── Page ──────

export default function JsonPathPage() {
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [pathExpr, setPathExpr] = useState("$.store.book[*].title");
  const [result, setResult] = useState<{ data: JSONValue[]; error: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const runQuery = useCallback(() => {
    try {
      const root = JSON.parse(jsonText) as JSONValue;
      const data = evaluatePath(root, pathExpr.trim());
      setResult({ data, error: null });
    } catch (err: unknown) {
      setResult({ data: [], error: err instanceof Error ? err.message : String(err) });
    }
  }, [jsonText, pathExpr]);

  const resultStr = result ? JSON.stringify(result.data.length === 1 ? result.data[0] : result.data, null, 2) : "";

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(resultStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [resultStr]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="JSON Path Tester"
      description="JSONPath 표현식으로 JSON 데이터를 쿼리합니다. $, ., [*], .., [?(@.key)] 등 핵심 문법을 지원합니다."
      icon={Filter}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* JSON 입력 */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-secondary">JSON 입력</span>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={20}
            spellCheck={false}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>

        {/* 쿼리 & 결과 */}
        <div className="flex flex-col gap-4">
          {/* 표현식 입력 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">JSONPath 표현식</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={pathExpr}
                onChange={(e) => setPathExpr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runQuery()}
                placeholder="$.store.book[*].title"
                className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onClick={runQuery}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                실행
              </button>
            </div>
          </div>

          {/* 예시 버튼 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">예시 쿼리</span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => { setPathExpr(ex.label); }}
                  title={ex.desc}
                  className="rounded-lg border border-border bg-bg-secondary px-2.5 py-1 font-mono text-xs text-text-secondary transition-colors hover:border-brand hover:text-brand"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* 결과 */}
          {result && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">
                  {result.error
                    ? "오류"
                    : `결과 (${result.data.length}개 매칭)`}
                </span>
                {!result.error && result.data.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {copied ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
                    {copied ? "복사됨" : "복사"}
                  </button>
                )}
              </div>
              {result.error ? (
                <div className="rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm" style={{ color: "rgb(239,68,68)" }}>
                  {result.error}
                </div>
              ) : (
                <textarea
                  readOnly
                  value={resultStr}
                  rows={10}
                  className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary focus:outline-none"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 문법 참조 */}
      <div className="mt-8 overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
          JSONPath 문법 참조
        </div>
        <div className="divide-y divide-border">
          {SYNTAX_REF.map((row) => (
            <div key={row.expr} className="flex items-center gap-6 px-4 py-2.5">
              <span className="w-48 shrink-0 font-mono text-xs text-brand">{row.expr}</span>
              <span className="text-xs text-text-secondary">{row.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
}
