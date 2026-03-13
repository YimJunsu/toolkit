"use client";

import { useState, useMemo, useCallback } from "react";
import { Bot, Plus, Trash2, Copy, Check, Download } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Web", href: "/tools/web" },
];

interface RobotRule {
  id: string;
  userAgent: string;
  allow: string[];
  disallow: string[];
}

const UA_PRESETS = ["*", "Googlebot", "Bingbot", "Yandexbot", "GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai"];

let _id = 0;
function uid() { return String(++_id); }

function generateRobotsTxt(rules: RobotRule[], sitemapUrl: string, crawlDelay: string): string {
  const blocks = rules.map((rule) => {
    const lines: string[] = [`User-agent: ${rule.userAgent}`];
    rule.disallow.forEach((p) => { if (p) lines.push(`Disallow: ${p}`); });
    rule.allow.forEach((p)    => { if (p) lines.push(`Allow: ${p}`);    });
    if (crawlDelay) lines.push(`Crawl-delay: ${crawlDelay}`);
    return lines.join("\n");
  });
  if (sitemapUrl) blocks.push(`Sitemap: ${sitemapUrl}`);
  return blocks.join("\n\n");
}

interface PathListProps {
  label: string;
  paths: string[];
  onAdd: () => void;
  onChange: (i: number, v: string) => void;
  onRemove: (i: number) => void;
}

function PathList({ label, paths, onAdd, onChange, onRemove }: PathListProps) {
  return (
    <div className="mb-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 text-xs text-brand hover:underline">
          <Plus size={10} /> 추가
        </button>
      </div>
      {paths.map((p, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={p}
            onChange={(e) => onChange(i, e.target.value)}
            placeholder="/path/"
            className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-1.5 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
          />
          <button type="button" onClick={() => onRemove(i)} className="text-text-secondary hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      {paths.length === 0 && <p className="text-xs text-text-secondary/50">없음</p>}
    </div>
  );
}

export default function RobotsGeneratorPage() {
  const [rules, setRules]         = useState<RobotRule[]>([{ id: uid(), userAgent: "*", allow: ["/"], disallow: ["/admin/"] }]);
  const [sitemapUrl, setSitemapUrl] = useState("https://example.com/sitemap.xml");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [copied, setCopied]       = useState(false);

  const output = useMemo(() => generateRobotsTxt(rules, sitemapUrl, crawlDelay), [rules, sitemapUrl, crawlDelay]);

  const addRule = () =>
    setRules((prev) => [...prev, { id: uid(), userAgent: "*", allow: [], disallow: ["/"] }]);

  const removeRule = (id: string) =>
    setRules((prev) => prev.filter((r) => r.id !== id));

  const updateRule = useCallback((id: string, patch: Partial<RobotRule>) =>
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r)), []);

  const addPath    = (id: string, f: "allow" | "disallow") =>
    updateRule(id, { [f]: [...(rules.find((r) => r.id === id)?.[f] ?? []), ""] });
  const updatePath = (id: string, f: "allow" | "disallow", i: number, v: string) =>
    updateRule(id, { [f]: (rules.find((r) => r.id === id)?.[f] ?? []).map((p, j) => j === i ? v : p) });
  const removePath = (id: string, f: "allow" | "disallow", i: number) =>
    updateRule(id, { [f]: (rules.find((r) => r.id === id)?.[f] ?? []).filter((_, j) => j !== i) });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([output], { type: "text/plain" }));
    a.download = "robots.txt";
    a.click();
  };

  const applyPreset = (preset: "public" | "ai-block") => {
    if (preset === "public") {
      setRules([{ id: uid(), userAgent: "*", allow: ["/"], disallow: ["/admin/", "/private/"] }]);
    } else {
      setRules((prev) => [
        ...prev,
        ...["GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai"].map((ua) => ({
          id: uid(), userAgent: ua, allow: [], disallow: ["/"],
        })),
      ]);
    }
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Robots.txt Generator"
      description="User-agent 규칙을 폼으로 설정하면 robots.txt를 즉시 생성합니다."
      icon={Bot}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* 좌: 설정 */}
        <div className="flex flex-col gap-6">

          {/* 빠른 프리셋 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-text-secondary">빠른 설정</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "public" as const,   label: "기본 공개 설정" },
                { key: "ai-block" as const, label: "AI 봇 차단 추가" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 규칙 카드 */}
          {rules.map((rule, ri) => (
            <div key={rule.id} className="rounded-xl border border-border bg-bg-secondary p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-text-primary">규칙 {ri + 1}</p>
                {rules.length > 1 && (
                  <button type="button" onClick={() => removeRule(rule.id)} className="text-text-secondary hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">User-agent</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rule.userAgent}
                    onChange={(e) => updateRule(rule.id, { userAgent: e.target.value })}
                    className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-2 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) updateRule(rule.id, { userAgent: e.target.value }); }}
                    className="rounded-lg border border-border bg-bg-primary px-2 py-2 text-xs text-text-secondary focus:outline-none"
                  >
                    <option value="">프리셋</option>
                    {UA_PRESETS.map((ua) => <option key={ua} value={ua}>{ua}</option>)}
                  </select>
                </div>
              </div>

              <PathList
                label="Disallow"
                paths={rule.disallow}
                onAdd={() => addPath(rule.id, "disallow")}
                onChange={(i, v) => updatePath(rule.id, "disallow", i, v)}
                onRemove={(i) => removePath(rule.id, "disallow", i)}
              />
              <PathList
                label="Allow"
                paths={rule.allow}
                onAdd={() => addPath(rule.id, "allow")}
                onChange={(i, v) => updatePath(rule.id, "allow", i, v)}
                onRemove={(i) => removePath(rule.id, "allow", i)}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-2 self-start rounded-lg border border-brand/40 bg-brand/10 px-4 py-2 text-sm text-brand transition-colors hover:bg-brand/20"
          >
            <Plus size={14} /> 규칙 추가
          </button>

          {/* 글로벌 설정 */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-text-secondary">글로벌 설정</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Sitemap URL</label>
              <input
                type="url"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                placeholder="https://example.com/sitemap.xml"
                className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">Crawl-delay (선택, 초)</label>
              <input
                type="number"
                value={crawlDelay}
                onChange={(e) => setCrawlDelay(e.target.value)}
                placeholder="예: 10"
                min="0"
                className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 우: 출력 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">robots.txt 미리보기</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? "복사됨" : "복사"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
              >
                <Download size={12} /> 다운로드
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            rows={22}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary focus:outline-none"
          />
        </div>
      </div>
    </ToolPageLayout>
  );
}