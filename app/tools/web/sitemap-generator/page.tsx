"use client";

import { useState, useMemo, useCallback } from "react";
import { Network, Plus, Trash2, Copy, Check, Download, FileText } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Web", href: "/tools/web" },
];

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapUrl {
  id: string;
  loc: string;
  lastmod: string;
  changefreq: ChangeFreq;
  priority: string;
}

const CHANGEFREQ_OPTIONS: ChangeFreq[] = ["always","hourly","daily","weekly","monthly","yearly","never"];
const PRIORITY_OPTIONS = ["1.0","0.9","0.8","0.7","0.6","0.5","0.4","0.3","0.2","0.1"];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function generateSitemap(urls: SitemapUrl[]): string {
  const entries = urls
    .filter((u) => u.loc)
    .map((u) =>
      [
        "  <url>",
        `    <loc>${u.loc}</loc>`,
        u.lastmod    && `    <lastmod>${u.lastmod}</lastmod>`,
        u.changefreq && `    <changefreq>${u.changefreq}</changefreq>`,
        u.priority   && `    <priority>${u.priority}</priority>`,
        "  </url>",
      ].filter(Boolean).join("\n")
    )
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    entries,
    `</urlset>`,
  ].join("\n");
}

let _uid = 0;
function uid() { return String(++_uid); }
function newEntry(loc = ""): SitemapUrl {
  return { id: uid(), loc, lastmod: todayStr(), changefreq: "weekly", priority: "0.5" };
}

export default function SitemapGeneratorPage() {
  const [urls, setUrls]           = useState<SitemapUrl[]>([newEntry("https://example.com/")]);
  const [bulkText, setBulkText]   = useState("");
  const [showBulk, setShowBulk]   = useState(false);
  const { copied, copy } = useClipboard();

  const output = useMemo(() => generateSitemap(urls), [urls]);

  const addUrl    = () => setUrls((prev) => [...prev, newEntry()]);
  const removeUrl = (id: string) => setUrls((prev) => prev.filter((u) => u.id !== id));

  const updateUrl = useCallback((id: string, patch: Partial<SitemapUrl>) =>
    setUrls((prev) => prev.map((u) => u.id === id ? { ...u, ...patch } : u)), []);

  const handleBulkAdd = () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    setUrls((prev) => [...prev, ...lines.map((loc) => newEntry(loc))]);
    setBulkText("");
    setShowBulk(false);
  };


  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([output], { type: "application/xml" }));
    a.download = "sitemap.xml";
    a.click();
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Sitemap Generator"
      description="URL 목록과 메타 정보를 입력하면 XML sitemap을 즉시 생성합니다."
      icon={Network}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* 좌: URL 목록 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">URL 목록 ({urls.length}개)</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulk((p) => !p)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
              >
                <FileText size={12} /> 일괄 추가
              </button>
              <button
                type="button"
                onClick={addUrl}
                className="flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs text-brand transition-colors hover:bg-brand/20"
              >
                <Plus size={12} /> URL 추가
              </button>
            </div>
          </div>

          {/* 일괄 입력 */}
          {showBulk && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-bg-secondary p-4">
              <p className="text-xs text-text-secondary">URL을 한 줄에 하나씩 입력하세요.</p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"https://example.com/page1\nhttps://example.com/page2"}
                rows={5}
                className="resize-none rounded-lg border border-border bg-bg-primary p-3 font-mono text-xs text-text-primary focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onClick={handleBulkAdd}
                disabled={!bulkText.trim()}
                className="self-end rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-bg-primary disabled:opacity-50"
              >
                추가
              </button>
            </div>
          )}

          {/* URL 카드들 */}
          <div className="flex flex-col gap-3">
            {urls.map((u) => (
              <div key={u.id} className="rounded-xl border border-border bg-bg-secondary p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary">URL</span>
                  <button type="button" onClick={() => removeUrl(u.id)} className="text-text-secondary hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>

                <input
                  type="url"
                  value={u.loc}
                  onChange={(e) => updateUrl(u.id, { loc: e.target.value })}
                  placeholder="https://example.com/page"
                  className="mb-3 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-text-secondary">lastmod</label>
                    <input
                      type="date"
                      value={u.lastmod}
                      onChange={(e) => updateUrl(u.id, { lastmod: e.target.value })}
                      className="rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-text-secondary">changefreq</label>
                    <select
                      value={u.changefreq}
                      onChange={(e) => updateUrl(u.id, { changefreq: e.target.value as ChangeFreq })}
                      className="rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary focus:border-brand focus:outline-none"
                    >
                      {CHANGEFREQ_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-text-secondary">priority</label>
                    <select
                      value={u.priority}
                      onChange={(e) => updateUrl(u.id, { priority: e.target.value })}
                      className="rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary focus:border-brand focus:outline-none"
                    >
                      {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우: XML 출력 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">sitemap.xml 미리보기</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copy(output, "sitemap")}
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
            rows={28}
            className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-xs text-text-primary focus:outline-none"
          />
        </div>
      </div>
    </ToolPageLayout>
  );
}