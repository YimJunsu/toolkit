"use client";

import { useState, useMemo } from "react";
import { Search, Check, AlertTriangle, X } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Web", href: "/tools/web" },
];

type Severity = "ok" | "warning" | "error";

interface SeoIssue {
  field: string;
  severity: Severity;
  message: string;
}

interface SeoInput {
  title: string;
  description: string;
  h1: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
}

function analyze(input: SeoInput): SeoIssue[] {
  const issues: SeoIssue[] = [];

  if (!input.title) {
    issues.push({ field: "Title", severity: "error", message: "Title 태그가 없습니다." });
  } else if (input.title.length > 60) {
    issues.push({ field: "Title", severity: "warning", message: `Title이 너무 깁니다 (${input.title.length}/60자). 검색 결과에서 잘릴 수 있습니다.` });
  } else if (input.title.length < 30) {
    issues.push({ field: "Title", severity: "warning", message: `Title이 짧습니다 (${input.title.length}/60자). 30자 이상 권장합니다.` });
  } else {
    issues.push({ field: "Title", severity: "ok", message: `Title 길이 적절 (${input.title.length}/60자).` });
  }

  if (!input.description) {
    issues.push({ field: "Meta Description", severity: "error", message: "Meta description이 없습니다." });
  } else if (input.description.length > 160) {
    issues.push({ field: "Meta Description", severity: "warning", message: `Description이 너무 깁니다 (${input.description.length}/160자).` });
  } else if (input.description.length < 70) {
    issues.push({ field: "Meta Description", severity: "warning", message: `Description이 짧습니다 (${input.description.length}/160자). 70자 이상 권장합니다.` });
  } else {
    issues.push({ field: "Meta Description", severity: "ok", message: `Description 길이 적절 (${input.description.length}/160자).` });
  }

  issues.push(!input.h1
    ? { field: "H1 태그", severity: "warning", message: "H1 태그가 없습니다. 페이지당 하나의 H1을 권장합니다." }
    : { field: "H1 태그", severity: "ok",      message: "H1 태그가 있습니다." });

  issues.push(!input.canonical
    ? { field: "Canonical URL", severity: "warning", message: "Canonical URL이 없습니다. 중복 콘텐츠 이슈가 생길 수 있습니다." }
    : { field: "Canonical URL", severity: "ok",      message: "Canonical URL이 설정되어 있습니다." });

  issues.push(!input.ogTitle
    ? { field: "og:title", severity: "warning", message: "og:title이 없습니다. 소셜 공유 시 title이 사용됩니다." }
    : { field: "og:title", severity: "ok",      message: "og:title이 설정되어 있습니다." });

  issues.push(!input.ogDescription
    ? { field: "og:description", severity: "warning", message: "og:description이 없습니다." }
    : { field: "og:description", severity: "ok",      message: "og:description이 설정되어 있습니다." });

  if (!input.ogImage) {
    issues.push({ field: "og:image", severity: "warning", message: "og:image가 없습니다. 소셜 공유 시 이미지가 표시되지 않습니다." });
  } else if (!input.ogImage.startsWith("https://")) {
    issues.push({ field: "og:image", severity: "warning", message: "og:image URL이 https://로 시작해야 합니다." });
  } else {
    issues.push({ field: "og:image", severity: "ok", message: "og:image가 설정되어 있습니다." });
  }

  issues.push(!input.twitterCard
    ? { field: "twitter:card", severity: "warning", message: "twitter:card가 없습니다." }
    : { field: "twitter:card", severity: "ok",      message: `twitter:card: ${input.twitterCard}` });

  return issues;
}

const SEVERITY_STYLE: Record<Severity, { icon: typeof Check; color: string; border: string }> = {
  ok:      { icon: Check,         color: "text-emerald-400", border: "border-emerald-500/20 bg-emerald-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-400",   border: "border-amber-500/20 bg-amber-500/10"   },
  error:   { icon: X,             color: "text-red-400",     border: "border-red-500/20 bg-red-500/10"       },
};

const FIELDS = [
  { key: "title"         as const, label: "Title 태그",         placeholder: "페이지 제목 (권장 30–60자)",        type: "input",    maxLen: 60  },
  { key: "description"   as const, label: "Meta Description",   placeholder: "페이지 설명 (권장 70–160자)",       type: "textarea", maxLen: 160 },
  { key: "h1"            as const, label: "H1 태그 내용",        placeholder: "페이지 메인 제목",                  type: "input",    maxLen: 0   },
  { key: "canonical"     as const, label: "Canonical URL",      placeholder: "https://example.com/page",         type: "input",    maxLen: 0   },
  { key: "ogTitle"       as const, label: "og:title",           placeholder: "소셜 공유용 제목",                  type: "input",    maxLen: 0   },
  { key: "ogDescription" as const, label: "og:description",     placeholder: "소셜 공유용 설명",                  type: "textarea", maxLen: 0   },
  { key: "ogImage"       as const, label: "og:image URL",       placeholder: "https://example.com/og.jpg",       type: "input",    maxLen: 0   },
  { key: "twitterCard"   as const, label: "twitter:card",       placeholder: "summary | summary_large_image",    type: "input",    maxLen: 0   },
];

export default function SeoAnalyzerPage() {
  const [input, setInput] = useState<SeoInput>({
    title: "", description: "", h1: "", canonical: "",
    ogTitle: "", ogDescription: "", ogImage: "", twitterCard: "",
  });

  const issues    = useMemo(() => analyze(input), [input]);
  const errCount  = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;
  const okCount   = issues.filter((i) => i.severity === "ok").length;
  const score     = Math.max(0, Math.round(100 - errCount * 20 - warnCount * 8));

  const scoreColor =
    score >= 80 ? "text-emerald-400" :
    score >= 60 ? "text-amber-400"   :
                  "text-red-400";

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="SEO 분석기"
      description="메타 태그 정보를 입력하면 SEO 최적화 상태를 즉시 분석하고 점수를 산출합니다."
      icon={Search}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* 좌: 입력 폼 */}
        <div className="flex flex-col gap-4">
          {FIELDS.map(({ key, label, placeholder, type, maxLen }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">{label}</label>
                {maxLen > 0 && (
                  <span className={`text-xs tabular-nums ${input[key].length > maxLen ? "text-red-400" : "text-text-secondary"}`}>
                    {input[key].length}/{maxLen}
                  </span>
                )}
              </div>
              {type === "textarea" ? (
                <textarea
                  value={input[key]}
                  onChange={(e) => setInput((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  rows={3}
                  className="resize-none rounded-xl border border-border bg-bg-secondary p-3 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={input[key]}
                  onChange={(e) => setInput((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>

        {/* 우: 결과 */}
        <div className="flex flex-col gap-5">
          {/* 점수 */}
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-bg-secondary py-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">SEO 점수</p>
            <p className={`text-6xl font-bold tabular-nums ${scoreColor}`}>{score}</p>
            <p className="text-sm text-text-secondary">/ 100</p>
            <div className="mt-3 flex gap-4 text-xs">
              <span className="text-red-400">{errCount}개 오류</span>
              <span className="text-amber-400">{warnCount}개 경고</span>
              <span className="text-emerald-400">{okCount}개 통과</span>
            </div>
          </div>

          {/* 항목별 결과 */}
          <div className="flex flex-col gap-2">
            {issues.map((issue) => {
              const { icon: Icon, color, border } = SEVERITY_STYLE[issue.severity];
              return (
                <div key={issue.field} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${border}`}>
                  <Icon size={14} className={`mt-0.5 shrink-0 ${color}`} />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{issue.field}</p>
                    <p className="text-xs text-text-secondary">{issue.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}