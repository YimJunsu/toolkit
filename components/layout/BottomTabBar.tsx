"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Star, Grid3X3 } from "lucide-react";

function openSpotlight() {
  document.dispatchEvent(new Event("open-spotlight"));
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-bg-primary/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="하단 탭 네비게이션"
    >
      <TabItem
        href="/"
        icon={<Home size={20} />}
        label="홈"
        active={pathname === "/"}
      />
      <button
        type="button"
        onClick={openSpotlight}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-text-secondary transition-colors hover:text-brand"
        aria-label="검색"
      >
        <Search size={20} />
        <span className="text-[10px] font-medium">검색</span>
      </button>
      <TabItem
        href="/tools/code"
        icon={<Grid3X3 size={20} />}
        label="도구"
        active={pathname.startsWith("/tools")}
      />
      <TabItem
        href="/about"
        icon={<Star size={20} />}
        label="소개"
        active={pathname === "/about"}
      />
    </nav>
  );
}

interface TabItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function TabItem({ href, icon, label, active }: TabItemProps) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
        active ? "text-brand" : "text-text-secondary hover:text-brand"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
