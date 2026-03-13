"use client";

import { useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Web", href: "/tools/web" },
];

export default function MetaPreviewPage() {
  const [title, setTitle]             = useState("내 페이지 제목 — 멋진 서비스");
  const [description, setDescription] = useState("이 페이지에서는 다양한 개발자 도구를 제공합니다. SEO 최적화, 색상 도구, 인코딩 변환 등 업무에 필요한 기능들을 한 곳에서 사용하세요.");
  const [url, setUrl]                 = useState("https://example.com/page");
  const [siteName, setSiteName]       = useState("example.com");

  const displayUrl      = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const truncatedTitle  = title.length > 60  ? title.slice(0, 57)  + "..." : title;
  const truncatedDesc   = description.length > 160 ? description.slice(0, 157) + "..." : description;
  const titleLen        = title.length;
  const descLen         = description.length;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Meta Tag Preview"
      description="메타 태그 정보를 입력하면 Google 검색 결과 스니펫을 실시간으로 미리봅니다."
      icon={MonitorSmartphone}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* 좌: 입력 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-primary">태그 정보 입력</h2>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">Title 태그</label>
              <span className={`text-xs tabular-nums ${titleLen > 60 ? "text-red-400" : titleLen > 50 ? "text-amber-400" : "text-text-secondary"}`}>
                {titleLen}/60
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="페이지 제목"
              className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">Meta Description</label>
              <span className={`text-xs tabular-nums ${descLen > 160 ? "text-red-400" : descLen > 140 ? "text-amber-400" : "text-text-secondary"}`}>
                {descLen}/160
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="페이지 설명"
              rows={4}
              className="resize-none rounded-xl border border-border bg-bg-secondary p-3 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">페이지 URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">사이트명</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="example.com"
              className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
            <strong className="text-text-primary">권장 길이</strong> — Title: 30–60자, Description: 70–160자.
            한글은 영문보다 넓어 더 짧게 유지하는 것이 좋습니다.
          </div>
        </div>

        {/* 우: 미리보기 */}
        <div className="flex flex-col gap-6">
          <h2 className="text-sm font-semibold text-text-primary">Google 검색 결과 미리보기</h2>

          {/* 데스크탑 스니펫 */}
          <div className="rounded-2xl border border-border bg-bg-secondary p-6">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-[10px] font-bold text-brand">
                {(siteName || "E")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-medium text-text-primary">{siteName || "example.com"}</p>
                <p className="text-[11px] text-text-secondary">{displayUrl}</p>
              </div>
            </div>
            <p className="mb-1 cursor-pointer text-lg font-medium leading-snug text-brand hover:underline">
              {truncatedTitle || "페이지 제목"}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              {truncatedDesc || "페이지 설명이 여기에 표시됩니다."}
            </p>
          </div>

          {/* 모바일 스니펫 */}
          <h3 className="text-xs font-semibold text-text-secondary">모바일 미리보기</h3>
          <div className="max-w-[360px] rounded-2xl border border-border bg-bg-secondary p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand/20 text-[9px] font-bold text-brand">
                {(siteName || "E")[0].toUpperCase()}
              </div>
              <span className="truncate text-[11px] text-text-secondary">{displayUrl}</span>
            </div>
            <p className="mb-1 text-sm font-medium leading-snug text-brand">
              {title.length > 50 ? title.slice(0, 47) + "..." : title || "페이지 제목"}
            </p>
            <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">
              {description || "페이지 설명"}
            </p>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}