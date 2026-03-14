"use client";

import { useState, useMemo } from "react";
import { GitCompare } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

const SAMPLE_A = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const result = greet("world");`;

const SAMPLE_B = `function greet(name: string): void {
  console.log(\`Hello, \${name}!\`);
}

const result = greet("toolkit");
console.log(result);`;

type DiffType = "equal" | "added" | "removed";

interface DiffLine {
  type: DiffType;
  lineA: number | null;
  lineB: number | null;
  text: string;
}

function computeDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const m = linesA.length;
  const n = linesB.length;

  // LCS 기반 diff
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (linesA[i] === linesB[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0, j = 0;
  let lineNumA = 1, lineNumB = 1;

  while (i < m || j < n) {
    if (i < m && j < n && linesA[i] === linesB[j]) {
      result.push({ type: "equal", lineA: lineNumA++, lineB: lineNumB++, text: linesA[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: "added", lineA: null, lineB: lineNumB++, text: linesB[j] });
      j++;
    } else {
      result.push({ type: "removed", lineA: lineNumA++, lineB: null, text: linesA[i] });
      i++;
    }
  }

  return result;
}

const BG: Record<DiffType, string> = {
  added: "bg-emerald-500/10 border-l-2 border-emerald-500",
  removed: "bg-red-500/10 border-l-2 border-red-500",
  equal: "",
};

const PREFIX: Record<DiffType, string> = {
  added: "+ ",
  removed: "- ",
  equal: "  ",
};

const TEXT_COLOR: Record<DiffType, string> = {
  added: "text-emerald-400",
  removed: "text-red-400",
  equal: "text-text-primary",
};

export default function DiffToolPage() {
  const [textA, setTextA] = useState(SAMPLE_A);
  const [textB, setTextB] = useState(SAMPLE_B);
  const [view, setView] = useState<"split" | "unified">("unified");

  const diff = useMemo(() => computeDiff(textA, textB), [textA, textB]);

  const stats = useMemo(() => ({
    added: diff.filter((d) => d.type === "added").length,
    removed: diff.filter((d) => d.type === "removed").length,
  }), [diff]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Diff / Merge Tool"
      description="두 텍스트의 차이를 라인 단위로 비교하고 추가/삭제를 시각화합니다."
      icon={GitCompare}
    >
      <div className="flex flex-col gap-4">
        {/* 뷰 토글 */}
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["unified", "split"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  view === v ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {v === "unified" ? "통합 뷰" : "분할 뷰"}
              </button>
            ))}
          </div>

          {(stats.added > 0 || stats.removed > 0) && (
            <div className="flex gap-2 text-xs">
              <span className="text-emerald-400">+{stats.added} 추가</span>
              <span className="text-red-400">-{stats.removed} 삭제</span>
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">원본 (A)</span>
            <textarea
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              rows={12}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">변경 (B)</span>
            <textarea
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              rows={12}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {/* Diff 결과 */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-secondary">비교 결과</span>

          {view === "unified" ? (
            <div className="overflow-auto rounded-xl border border-border bg-bg-secondary">
              <table className="w-full min-w-[500px] font-mono text-xs">
                <tbody>
                  {diff.map((line, idx) => (
                    <tr key={idx} className={BG[line.type]}>
                      <td className="w-10 select-none border-r border-border px-2 py-0.5 text-right text-text-secondary/60">
                        {line.lineA ?? ""}
                      </td>
                      <td className="w-10 select-none border-r border-border px-2 py-0.5 text-right text-text-secondary/60">
                        {line.lineB ?? ""}
                      </td>
                      <td className={`px-4 py-0.5 whitespace-pre ${TEXT_COLOR[line.type]}`}>
                        <span className="select-none opacity-60">{PREFIX[line.type]}</span>
                        {line.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-0 overflow-auto rounded-xl border border-border bg-bg-secondary">
              {/* 왼쪽: A */}
              <div className="border-r border-border">
                <div className="border-b border-border bg-bg-secondary px-3 py-1.5 text-xs font-semibold text-text-secondary">원본 (A)</div>
                <table className="w-full font-mono text-xs">
                  <tbody>
                    {diff.filter((d) => d.type !== "added").map((line, idx) => (
                      <tr key={idx} className={line.type === "removed" ? BG.removed : ""}>
                        <td className="w-8 select-none border-r border-border px-2 py-0.5 text-right text-text-secondary/60">
                          {line.lineA}
                        </td>
                        <td className={`px-3 py-0.5 whitespace-pre ${line.type === "removed" ? TEXT_COLOR.removed : TEXT_COLOR.equal}`}>
                          {line.text}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* 오른쪽: B */}
              <div>
                <div className="border-b border-border bg-bg-secondary px-3 py-1.5 text-xs font-semibold text-text-secondary">변경 (B)</div>
                <table className="w-full font-mono text-xs">
                  <tbody>
                    {diff.filter((d) => d.type !== "removed").map((line, idx) => (
                      <tr key={idx} className={line.type === "added" ? BG.added : ""}>
                        <td className="w-8 select-none border-r border-border px-2 py-0.5 text-right text-text-secondary/60">
                          {line.lineB}
                        </td>
                        <td className={`px-3 py-0.5 whitespace-pre ${line.type === "added" ? TEXT_COLOR.added : TEXT_COLOR.equal}`}>
                          {line.text}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
}