"use client";

import { useState } from "react";
import { Gauge, Search, RefreshCw, AlertCircle } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Web", href: "/tools/web" },
];

type Strategy = "mobile" | "desktop";

interface MetricItem {
  id: string;
  label: string;
  desc: string;
  displayValue: string;
  score: number;
}

interface PsiResult {
  performanceScore: number;
  metrics: MetricItem[];
  url: string;
  strategy: Strategy;
}

const METRIC_DEFS = [
  { id: "largest-contentful-paint", label: "LCP", desc: "Largest Contentful Paint" },
  { id: "first-contentful-paint",   label: "FCP", desc: "First Contentful Paint"   },
  { id: "total-blocking-time",      label: "TBT", desc: "Total Blocking Time"       },
  { id: "cumulative-layout-shift",  label: "CLS", desc: "Cumulative Layout Shift"   },
  { id: "speed-index",              label: "SI",  desc: "Speed Index"               },
  { id: "interactive",              label: "TTI", desc: "Time to Interactive"       },
];

function metricColor(score: number) {
  if (score >= 0.9) return "text-emerald-400";
  if (score >= 0.5) return "text-amber-400";
  return "text-red-400";
}

function metricBg(score: number) {
  if (score >= 0.9) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 0.5) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function metricLabel(score: number) {
  if (score >= 0.9) return "좋음";
  if (score >= 0.5) return "개선 필요";
  return "불량";
}

async function runPageSpeed(url: string, strategy: Strategy): Promise<PsiResult> {
  const endpoint =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`API 오류: ${res.status} ${res.statusText}`);
  const data = await res.json();

  const audits   = data.lighthouseResult?.audits ?? {};
  const perfScore = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100);

  const metrics: MetricItem[] = METRIC_DEFS
    .map(({ id, label, desc }) => {
      const audit = audits[id];
      return { id, label, desc, displayValue: audit?.displayValue ?? "", score: audit?.score ?? 0 };
    })
    .filter((m) => m.displayValue);

  return { performanceScore: perfScore, metrics, url, strategy };
}

export default function PerformanceTestPage() {
  const [url, setUrl]         = useState("https://");
  const [strategy, setStrategy] = useState<Strategy>("mobile");
  const [result, setResult]   = useState<PsiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleRun = async () => {
    if (!url.startsWith("http")) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await runPageSpeed(url, strategy));
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const perf = result?.performanceScore ?? 0;
  const perfColor =
    perf >= 90 ? "text-emerald-400" :
    perf >= 50 ? "text-amber-400"   :
                 "text-red-400";

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Performance Test"
      description="Google PageSpeed Insights API로 Core Web Vitals를 측정합니다."
      icon={Gauge}
    >
      <div className="flex flex-col gap-6">

        {/* 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">Google PageSpeed Insights</strong> 공개 API를 사용합니다.
          API 키 없이 사용 시 요청 횟수가 제한될 수 있으며, 결과는 서버 위치·네트워크 상태에 따라 달라질 수 있습니다.
        </div>

        {/* URL + 전략 + 버튼 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">분석할 URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRun()}
              placeholder="https://example.com"
              className="rounded-xl border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex rounded-lg border border-border p-0.5">
            {(["mobile", "desktop"] as Strategy[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStrategy(s)}
                className={`rounded-md px-4 py-2 text-xs font-medium transition-colors ${
                  strategy === s ? "bg-brand text-bg-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {s === "mobile" ? "모바일" : "데스크탑"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={loading || !url.startsWith("http")}
            className="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? "분석 중..." : "분석"}
          </button>
        </div>

        {/* 에러 */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-bg-secondary py-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Performance Score</p>
              <p className={`text-7xl font-bold tabular-nums ${perfColor}`}>{perf}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {result.strategy === "mobile" ? "모바일" : "데스크탑"} · {result.url}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {result.metrics.map((m) => (
                <div key={m.id} className={`flex flex-col gap-1 rounded-xl border px-4 py-4 ${metricBg(m.score)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-text-secondary">{m.label}</span>
                    <span className={`text-xs font-semibold ${metricColor(m.score)}`}>{metricLabel(m.score)}</span>
                  </div>
                  <p className={`text-2xl font-bold tabular-nums ${metricColor(m.score)}`}>{m.displayValue}</p>
                  <p className="text-xs text-text-secondary">{m.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
              <span><span className="font-semibold text-emerald-400">●</span> 좋음: 90+</span>
              <span><span className="font-semibold text-amber-400">●</span> 개선 필요: 50–89</span>
              <span><span className="font-semibold text-red-400">●</span> 불량: 0–49</span>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}