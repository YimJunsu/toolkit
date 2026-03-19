"use client";

import { useState, useMemo } from "react";
import { Columns2 } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Text", href: "/tools/text" },
];

const SAMPLE_A = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const result = greet("World");
console.log(result);`;

const SAMPLE_B = `function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!");
  return name;
}

const result = greet("World", "Hi");
console.log("Result:", result);`;

type DiffLine = { type: "equal" | "add" | "remove"; text: string };

function computeDiff(a: string[], b: string[]): DiffLine[] {
  const m = a.length;
  const n = b.length;

  // LCS 기반 diff
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: "equal", text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", text: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: "remove", text: a[i - 1] });
      i--;
    }
  }
  return result;
}

export default function TextDiffPage() {
  const [textA, setTextA] = useState(SAMPLE_A);
  const [textB, setTextB] = useState(SAMPLE_B);

  const diff = useMemo(() => {
    const linesA = textA.split("\n");
    const linesB = textB.split("\n");
    return computeDiff(linesA, linesB);
  }, [textA, textB]);

  const stats = useMemo(() => {
    const added = diff.filter((l) => l.type === "add").length;
    const removed = diff.filter((l) => l.type === "remove").length;
    const equal = diff.filter((l) => l.type === "equal").length;
    return { added, removed, equal };
  }, [diff]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Text Diff Viewer"
      description="두 텍스트를 비교하여 추가·삭제·동일한 라인을 시각적으로 표시합니다. LCS 알고리즘 기반 실시간 비교."
      icon={Columns2}
    >
      {/* 입력 영역 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">원본 텍스트</span>
            <button
              type="button"
              onClick={() => setTextA("")}
              disabled={!textA}
              className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
            >
              지우기
            </button>
          </div>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="원본 텍스트를 입력하세요..."
            rows={12}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">수정된 텍스트</span>
            <button
              type="button"
              onClick={() => setTextB("")}
              disabled={!textB}
              className="text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
            >
              지우기
            </button>
          </div>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="수정된 텍스트를 입력하세요..."
            rows={12}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {/* 통계 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "rgb(34,197,94)" }}>+</span>
          <span className="text-xs text-text-secondary">추가</span>
          <span className="font-mono text-sm font-bold text-text-primary">{stats.added}줄</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold" style={{ background: "rgba(239,68,68,0.15)", color: "rgb(239,68,68)" }}>-</span>
          <span className="text-xs text-text-secondary">삭제</span>
          <span className="font-mono text-sm font-bold text-text-primary">{stats.removed}줄</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-text-secondary">=</span>
          <span className="text-xs text-text-secondary">동일</span>
          <span className="font-mono text-sm font-bold text-text-primary">{stats.equal}줄</span>
        </div>
      </div>

      {/* Diff 결과 */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
          비교 결과
        </div>
        {diff.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">
            텍스트를 입력하면 실시간으로 비교됩니다.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full border-collapse font-mono text-sm">
              <tbody>
                {diff.map((line, idx) => {
                  const isAdd = line.type === "add";
                  const isRemove = line.type === "remove";
                  return (
                    <tr
                      key={idx}
                      style={
                        isAdd
                          ? { background: "rgba(34,197,94,0.08)" }
                          : isRemove
                          ? { background: "rgba(239,68,68,0.08)" }
                          : {}
                      }
                    >
                      <td
                        className="w-8 select-none border-r border-border px-3 py-0.5 text-center text-xs font-bold"
                        style={
                          isAdd
                            ? { color: "rgb(34,197,94)" }
                            : isRemove
                            ? { color: "rgb(239,68,68)" }
                            : { color: "transparent" }
                        }
                      >
                        {isAdd ? "+" : isRemove ? "-" : "·"}
                      </td>
                      <td
                        className="whitespace-pre px-4 py-0.5 text-text-primary"
                        style={
                          isAdd
                            ? { color: "rgb(34,197,94)" }
                            : isRemove
                            ? { color: "rgb(239,68,68)" }
                            : {}
                        }
                      >
                        {line.text || " "}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
