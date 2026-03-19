"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toolStorage } from "@/lib/toolStorage";
import { CATEGORIES } from "@/lib/constants/categories";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";

const HREF_TO_ID = new Map<string, string>(
  CATEGORIES.flatMap((c) => TOOLS_BY_CATEGORY[c.id] ?? []).map((t) => [t.href, t.id])
);

/** 도구 페이지 방문 시 자동으로 최근 사용 목록에 추가 */
export function RecentTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const toolId = HREF_TO_ID.get(pathname);
    if (toolId) toolStorage.addRecent(toolId);
  }, [pathname]);

  return null;
}
