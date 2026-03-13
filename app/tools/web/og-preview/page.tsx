"use client";

import { useState } from "react";
import { Share2, ImageIcon } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Web", href: "/tools/web" },
];

type Platform = "facebook" | "twitter" | "discord";

const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: "Facebook",
  twitter:  "Twitter / X",
  discord:  "Discord",
};

interface OgInput {
  title: string;
  description: string;
  url: string;
  siteName: string;
  image: string;
}

function ImgOrPlaceholder({ src, className }: { src: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-border bg-bg-primary ${className ?? "aspect-video w-full"}`}>
        <ImageIcon size={28} className="text-text-secondary/40" />
      </div>
    );
  }
  return <img src={src} alt="og" className={className ?? "aspect-video w-full object-cover rounded-lg"} onError={() => setErr(true)} />;
}

function FacebookCard({ og }: { og: OgInput }) {
  const domain = og.url.replace(/^https?:\/\//, "").split("/")[0] || "example.com";
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary" style={{ maxWidth: 500 }}>
      <ImgOrPlaceholder src={og.image} className="aspect-video w-full object-cover" />
      <div className="border-t border-border px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-text-secondary">{domain}</p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-text-primary">{og.title || "og:title"}</p>
        <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{og.description || "og:description"}</p>
        {og.siteName && <p className="mt-1 text-xs text-text-secondary">{og.siteName}</p>}
      </div>
    </div>
  );
}

function TwitterCard({ og }: { og: OgInput }) {
  const domain = og.url.replace(/^https?:\/\//, "").split("/")[0] || "example.com";
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-secondary" style={{ maxWidth: 500 }}>
      <ImgOrPlaceholder src={og.image} className="aspect-video w-full object-cover" />
      <div className="px-4 py-3">
        <p className="line-clamp-1 text-sm font-semibold text-text-primary">{og.title || "og:title"}</p>
        <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{og.description || "og:description"}</p>
        <p className="mt-2 text-xs text-text-secondary">{domain}</p>
      </div>
    </div>
  );
}

function DiscordCard({ og }: { og: OgInput }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary" style={{ maxWidth: 432 }}>
      <div className="flex">
        <div className="w-1 shrink-0 bg-brand" />
        <div className="flex flex-col gap-2 p-4">
          {og.siteName && <p className="text-xs font-semibold text-brand">{og.siteName}</p>}
          <p className="text-sm font-bold text-text-primary">{og.title || "og:title"}</p>
          <p className="text-xs leading-relaxed text-text-secondary">{og.description || "og:description"}</p>
          {og.image && !imgErr && (
            <img
              src={og.image}
              alt="og"
              className="mt-2 max-h-[280px] rounded-lg object-cover"
              onError={() => setImgErr(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const FORM_FIELDS: { key: keyof OgInput; label: string; placeholder: string; type: "input" | "textarea" }[] = [
  { key: "title",       label: "og:title",       placeholder: "공유 제목",                              type: "input"    },
  { key: "description", label: "og:description",  placeholder: "공유 설명",                              type: "textarea" },
  { key: "url",         label: "og:url",          placeholder: "https://example.com",                   type: "input"    },
  { key: "siteName",    label: "og:site_name",    placeholder: "사이트 이름",                            type: "input"    },
  { key: "image",       label: "og:image",        placeholder: "https://example.com/og.jpg (1200×630 권장)", type: "input" },
];

export default function OgPreviewPage() {
  const [platform, setPlatform] = useState<Platform>("facebook");
  const [og, setOg] = useState<OgInput>({
    title:       "멋진 서비스 — tool.kit",
    description: "개발자와 디자이너를 위한 종합 도구 사이트입니다. 인코딩, 변환, 디자인 등 다양한 도구를 한 곳에서 사용하세요.",
    url:         "https://toolkit.example.com",
    siteName:    "tool.kit",
    image:       "",
  });

  const set = (key: keyof OgInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setOg((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="OpenGraph Preview"
      description="og: 태그 정보를 입력하면 Facebook · Twitter · Discord 소셜 카드를 실시간으로 미리봅니다."
      icon={Share2}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* 좌: 입력 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-primary">OG 태그 입력</h2>

          {FORM_FIELDS.map(({ key, label, placeholder, type }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">{label}</label>
              {type === "textarea" ? (
                <textarea
                  value={og[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  rows={3}
                  className="resize-none rounded-xl border border-border bg-bg-secondary p-3 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={og[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
                />
              )}
            </div>
          ))}

          <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
            <strong className="text-text-primary">og:image 권장 크기</strong> — 1200×630px (1.91:1 비율).
            외부 이미지 URL을 입력하면 실시간 미리보기가 가능합니다.
          </div>
        </div>

        {/* 우: 미리보기 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">미리보기</h2>
            <div className="flex gap-1 rounded-lg border border-border p-0.5">
              {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    platform === p ? "bg-brand text-bg-primary" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {platform === "facebook" && <FacebookCard og={og} />}
          {platform === "twitter"  && <TwitterCard  og={og} />}
          {platform === "discord"  && <DiscordCard  og={og} />}
        </div>
      </div>
    </ToolPageLayout>
  );
}