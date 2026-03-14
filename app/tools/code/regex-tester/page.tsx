"use client";

import { useState, useMemo } from "react";
import { Regex, AlertTriangle } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

const FLAGS = [
  { flag: "g", label: "global", desc: "전체 매치" },
  { flag: "i", label: "insensitive", desc: "대소문자 무시" },
  { flag: "m", label: "multiline", desc: "멀티라인" },
  { flag: "s", label: "dotAll", desc: ". 이 줄바꿈 포함" },
];

interface MatchInfo {
  value: string;
  index: number;
  groups: Record<string, string> | null;
}

function highlightMatches(text: string, regex: RegExp): string {
  return text.replace(regex, (match) =>
    `<mark class="bg-brand/30 text-text-primary rounded px-0.5">${match.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</mark>`
  );
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [testText, setTestText] = useState(
    "hello@example.com, world@test.org, invalid-email"
  );
  const [activeFlags, setActiveFlags] = useState<Set<string>>(new Set(["g", "i"]));

  const toggleFlag = (flag: string) => {
    setActiveFlags((prev) => {
      const next = new Set(prev);
      next.has(flag) ? next.delete(flag) : next.add(flag);
      return next;
    });
  };

  const result = useMemo<{
    matches: MatchInfo[];
    highlighted: string;
    error: string | null;
    flagStr: string;
  }>(() => {
    const flagStr = [...activeFlags].join("");
    if (!pattern) return { matches: [], highlighted: testText, error: null, flagStr };
    try {
      const regex = new RegExp(pattern, flagStr);
      const matches: MatchInfo[] = [];

      if (flagStr.includes("g")) {
        let m: RegExpExecArray | null;
        const re = new RegExp(pattern, flagStr);
        while ((m = re.exec(testText)) !== null) {
          matches.push({ value: m[0], index: m.index, groups: m.groups ?? null });
          if (m[0].length === 0) re.lastIndex++;
        }
      } else {
        const m = regex.exec(testText);
        if (m) matches.push({ value: m[0], index: m.index, groups: m.groups ?? null });
      }

      const highlightRegex = new RegExp(pattern, flagStr.includes("g") ? flagStr : `g${flagStr}`);
      const highlighted = highlightMatches(testText.replace(/</g, "&lt;").replace(/>/g, "&gt;"), highlightRegex);

      return { matches, highlighted, error: null, flagStr };
    } catch (e) {
      return {
        matches: [],
        highlighted: testText,
        error: e instanceof Error ? e.message : "정규식 오류",
        flagStr,
      };
    }
  }, [pattern, testText, activeFlags]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Regex Tester"
      description="정규식 패턴을 실시간으로 테스트하고 매치 결과를 시각화합니다."
      icon={Regex}
    >
      <div className="flex flex-col gap-5">
        {/* 패턴 입력 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">정규식 패턴</label>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-bg-secondary px-4 py-2 font-mono text-sm">
            <span className="text-text-secondary select-none">/</span>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="(\\w+)"
              className={`flex-1 bg-transparent text-text-primary placeholder-text-secondary/50 focus:outline-none ${
                result.error ? "text-red-400" : ""
              }`}
              spellCheck={false}
            />
            <span className="text-text-secondary select-none">/{result.flagStr}</span>
          </div>
          {result.error && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle size={12} />
              {result.error}
            </p>
          )}
        </div>

        {/* 플래그 */}
        <div className="flex flex-wrap gap-2">
          {FLAGS.map(({ flag, label, desc }) => (
            <button
              key={flag}
              type="button"
              onClick={() => toggleFlag(flag)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                activeFlags.has(flag)
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-secondary hover:border-brand/50"
              }`}
              title={desc}
            >
              <code className="font-bold">{flag}</code>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* 테스트 텍스트 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">테스트 텍스트</label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={5}
            spellCheck={false}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>

        {/* 하이라이트 결과 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">매치 결과</span>
            <span className={`text-xs font-medium ${result.matches.length > 0 ? "text-brand" : "text-text-secondary"}`}>
              {result.matches.length}개 매치
            </span>
          </div>
          <div
            className="min-h-[80px] rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: result.highlighted || '<span class="opacity-40">텍스트를 입력하세요</span>' }}
          />
        </div>

        {/* 매치 상세 */}
        {result.matches.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">매치 상세</span>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-3 py-2 text-left font-semibold text-text-secondary">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-text-secondary">값</th>
                    <th className="px-3 py-2 text-left font-semibold text-text-secondary">위치</th>
                    <th className="px-3 py-2 text-left font-semibold text-text-secondary">그룹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.matches.map((m, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-text-secondary">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-brand">{m.value}</td>
                      <td className="px-3 py-2 text-text-secondary">{m.index}</td>
                      <td className="px-3 py-2 text-text-secondary">
                        {m.groups ? Object.entries(m.groups).map(([k, v]) => `${k}: ${v}`).join(", ") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}