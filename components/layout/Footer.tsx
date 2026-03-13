import Link from "next/link";
import { CATEGORIES } from "@/lib/constants/categories";

interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

const SERVICE_LINK_GROUP: FooterLinkGroup = {
  title: "서비스",
  links: [
    { label: "소개",         href: "/about" },
  ],
};

const LEGAL_LINK_GROUP: FooterLinkGroup = {
  title: "법적 고지",
  links: [
    { label: "이용약관",           href: "/terms" },
    { label: "개인정보 처리방침",   href: "/privacy" },
  ],
};

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-primary">
      <div className="w-full px-4 md:px-6 lg:px-8">

        {/* ── 상단: 브랜드 + 링크 그룹 ── */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* 브랜드 */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-fit font-bold text-text-primary transition-opacity hover:opacity-80"
            >
              <span className="text-lg tracking-tight">
                tool<span className="text-brand">.</span>kit
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-text-secondary">
              개발자와 디자이너를 위한<br />
              종합 도구 사이트
            </p>
          </div>

          {/* 서비스 */}
          <FooterLinkGroupColumn group={SERVICE_LINK_GROUP} />

          {/* 법적 고지 */}
          <FooterLinkGroupColumn group={LEGAL_LINK_GROUP} />



          {/* 카테고리 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-primary">
              카테고리
            </h3>
            <ul className="flex flex-col gap-2.5">
              {CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <Link
                        href={category.href}
                        className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {category.label}
                    </Link>
                  </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── 하단: 저작권 + 법적 링크 ── */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border py-6 sm:flex-row">
          <p className="text-xs text-text-secondary">
            &copy; {CURRENT_YEAR} tool.kit. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              개인정보 처리방침
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

/* ── 링크 그룹 컬럼 ── */

interface FooterLinkGroupColumnProps {
  group: FooterLinkGroup;
}

function FooterLinkGroupColumn({ group }: FooterLinkGroupColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-text-primary">
        {group.title}
      </h3>
      <ul className="flex flex-col gap-2.5">
        {group.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}