"use client";

import { Coffee, Gamepad2 } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { Gallery4, Gallery4Item } from "@/components/blocks/gallery4";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
];

const COFFEE_GAMES: Gallery4Item[] = [
  {
    id: "animal-run",
    title: "🐎 동물 달리기",
    description: "최대 8마리의 동물이 3D 트랙을 달리는 레이스! 랜덤 장애물과 부스트 존이 있어 끝까지 모릅니다. 꼴찌가 커피 사요~",
    href: "/tools/etc/coffee-bet/animal-run",
    image: "/resources/games/animalrace.jpg",
  },
  {
    id: "garapon",
    title: "🎰 가라폰 (구슬 뽑기)",
    description: "일본 전통 구슬 뽑기 기계! 핸들을 돌려서 커피 살 사람을 결정하세요. 데스크탑은 마우스, 모바일은 터치로 핸들 회전!",
    href: "/tools/etc/coffee-bet/garapon",
    image: "/resources/games/garapon.jpg",
  },
  {
    id: "coming-soon-1",
    title: "🃏 준비 중",
    description: "새로운 커피내기 게임이 곧 추가됩니다!",
    href: "#",
    image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=1080&auto=format&fit=crop",
  },
  {
    id: "coming-soon-2",
    title: "🎯 준비 중",
    description: "새로운 커피내기 게임이 곧 추가됩니다!",
    href: "#",
    image: "https://images.unsplash.com/photo-1543160401-26798e3b4a37?q=80&w=1080&auto=format&fit=crop",
  },
];

export default function CoffeeBetPage() {
  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="커피내기 컬렉션"
      description="팀원과 즐겁게 커피 내기를 할 수 있는 다양한 게임 모음입니다. 오늘 점심 커피는 누가?"
      icon={Coffee}
    >
      <div className="space-y-8">
        <Gallery4
          title="게임 선택"
          description="원하는 게임을 선택해서 주문할 사람을 골라보세요!"
          items={COFFEE_GAMES}
          imageAspectRatio="aspect-[3/4]"
          className="py-0"
        />

        <div className="mx-auto max-w-4xl rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-secondary">
            <Gamepad2 className="size-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-red-500">
            ⚠️ 주의사항: 게임에서 걸린 사람은 꼭 사세요.
          </h3>
        </div>
      </div>
    </ToolPageLayout>
  );
}