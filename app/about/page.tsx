import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  Layers,
  Code2,
  Database,
  ArrowLeftRight,
  Palette,
  Globe,
  Type,
  Lock,
  FileOutput,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";

export const metadata: Metadata = {
  title: "소개",
  description: "tool.kit은 개발자와 디자이너를 위한 종합 도구 사이트입니다.",
};

/* ── 핵심 가치 데이터 ── */

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: Zap,
    title: "빠른 접근",
    description:
      "자주 쓰는 도구를 즐겨찾기 없이 바로 찾을 수 있도록 카테고리별로 정리되어 있습니다.",
  },
  {
    icon: ShieldCheck,
    title: "사용 시 광고 없음",
    description:
      "사용 중 불필요한 광고 팝업, 멤버십 가입 권유 없이 도구 사용에만 집중할 수 있는 깔끔한 환경을 제공합니다." +
        "\n※ 단, UI적 광고는 삽입.. (컨텐츠 유지를 위한..)",
  },
  {
    icon: Layers,
    title: "다양한 도구",
    description:
      "코드, 디자인, 텍스트, 인코딩 등 개발·디자인 업무에서 실제로 쓰이는 도구들을 모았습니다.",
  },
  {
    icon: Code2,
    title: "개발자·디자이너 특화",
    description:
      "실무 경험을 바탕으로 실제로 필요한 기능을 중심으로 설계된 도구들을 제공합니다.",
  },
];

/* ── 카테고리 아이콘 매핑 ── */

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "code":           Code2,
  "data-format":    Database,
  "converter":      ArrowLeftRight,
  "design":         Palette,
  "web":            Globe,
  "text":           Type,
  "encode-decode":  Lock,
  "file-converter": FileOutput,
  "etc":            MoreHorizontal,
};

/* ── 페이지 ── */

export default function AboutPage() {
  return (
    <div className="w-full">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* 배경 그라데이션 장식 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative w-full px-4 py-24 text-center md:px-6 lg:px-8 lg:py-32">
          {/* 배지 */}
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
            개발자 & 디자이너를 위한 종합 도구
          </span>

          {/* 타이틀 */}
          <h1 className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl lg:text-6xl">
            필요한 도구,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              한 곳에서
            </span>
          </h1>

          {/* 서브타이틀 */}
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
            tool.kit은 개발자와 디자이너가 실무에서 반복적으로 필요한 도구들을
            하나의 사이트에서 빠르게 사용할 수 있도록 모아둔 종합 도구 사이트입니다.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              도구 둘러보기
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link
              href="/tools/code"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              코드 도구 바로가기
            </Link>
          </div>
        </div>
      </section>

      {/* ── 핵심 가치 ── */}
      <section className="w-full border-b border-border px-4 py-20 md:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-text-primary">
            왜 tool.kit인가요?
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            실무에서 출발한 도구, 사용자를 위한 경험
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </ul>
      </section>

      {/* ── 카테고리 미리보기 ── */}
      <section className="w-full border-b border-border px-4 py-20 md:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-text-primary">
            어떤 도구가 있나요?
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            총 9개 카테고리에 걸쳐 다양한 도구를 지속적으로 추가하고 있습니다.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICON_MAP[category.id];
            return (
              <li key={category.id}>
                <Link
                  href={category.href}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-bg-secondary p-5 transition-all hover:border-brand/50 hover:shadow-sm"
                >
                  {Icon && (
                    <Icon
                      size={22}
                      className="text-text-secondary transition-colors group-hover:text-brand"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-sm font-medium text-text-secondary transition-colors group-hover:text-text-primary">
                    {category.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── 마무리 CTA ── */}
      <section className="w-full px-4 py-20 text-center md:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-text-primary">
          지금 바로 시작해보세요
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
          회원가입 없이 모든 도구를 무료로 사용할 수 있습니다.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          도구 둘러보기
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>

    </div>
  );
}

/* ── 핵심 가치 카드 ── */

interface FeatureCardProps {
  feature: FeatureItem;
}

function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;
  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-bg-secondary p-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
        <Icon size={18} className="text-brand" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold text-text-primary">{feature.title}</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
      </div>
    </li>
  );
}