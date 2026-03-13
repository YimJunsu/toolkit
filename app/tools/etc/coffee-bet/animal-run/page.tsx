"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Rabbit } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

// 씬 컴포넌트를 동적으로 불러옴 (SSR 비활성화 - Three.js는 브라우저 전용)
const AnimalRaceScene = dynamic(() => import("./scene"), { ssr: false });

// ─── 타입 정의 ───────────────────────────────────────────────────────────────
export interface Player {
  id: number;
  name: string;
}

export type MapType = "forest" | "desert";

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const ANIMALS = [
  { emoji: "🐎", color: "#c9a227" },
  { emoji: "🐇", color: "#e8e8e8" },
  { emoji: "🦊", color: "#c87941" },
  { emoji: "🐶", color: "#8B5A2B" },
  { emoji: "🐱", color: "#808080" },
  { emoji: "🐷", color: "#ff9eb5" },
  { emoji: "🐄", color: "#2C2C2C" },
  { emoji: "🔔", color: "#f0c040" },
];

// 순위 뱃지 색상
const RANK_BADGE_CLASSES = [
  "bg-yellow-400 text-yellow-900",   // 1위 - 금
  "bg-gray-300 text-gray-800",       // 2위 - 은
  "bg-amber-600 text-amber-50",      // 3위 - 동
  "bg-bg-secondary text-text-secondary", // 4위 이하
];

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
  { label: "커피내기 컬렉션", href: "/tools/etc/coffee-bet" },
];

// ─── 기본 플레이어 생성 함수 ───────────────────────────────────────────────────
function createDefaultPlayers(): Player[] {
  return [
    { id: 0, name: "플레이어 1" },
    { id: 1, name: "플레이어 2" },
  ];
}

// ─── 메인 페이지 컴포넌트 ─────────────────────────────────────────────────────
export default function AnimalRunPage() {
  // 게임 단계: setup → racing → result
  const [phase, setPhase] = useState<"setup" | "racing" | "result">("setup");

  // 플레이어 목록
  const [players, setPlayers] = useState<Player[]>(createDefaultPlayers());

  // 선택된 맵
  const [selectedMap, setSelectedMap] = useState<MapType>("forest");

  // 최종 순위 (player id 배열, 0번 인덱스 = 1등)
  const [finishOrder, setFinishOrder] = useState<number[]>([]);

  // ── 플레이어 이름 변경 ────────────────────────────────────────────────────
  function handleNameChange(id: number, name: string) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  // ── 플레이어 추가 (최대 8명) ───────────────────────────────────────────────
  function handleAddPlayer() {
    if (players.length >= 8) return;
    const newId = players.length;
    setPlayers((prev) => [
      ...prev,
      { id: newId, name: `플레이어 ${newId + 1}` },
    ]);
  }

  // ── 플레이어 제거 (최소 2명) ───────────────────────────────────────────────
  function handleRemovePlayer(id: number) {
    if (players.length <= 2) return;
    // 제거 후 id 재배정
    setPlayers((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p, idx) => ({ ...p, id: idx }))
    );
  }

  // ── 레이스 시작 ───────────────────────────────────────────────────────────
  function handleStartRace() {
    setFinishOrder([]);
    setPhase("racing");
  }

  // ── 레이스 완료 콜백 (scene.tsx에서 호출됨) ────────────────────────────────
  function handleRaceFinish(orderedIds: number[]) {
    setFinishOrder(orderedIds);
    setPhase("result");
  }

  // ── 다시 하기 ─────────────────────────────────────────────────────────────
  function handleRestart() {
    setPlayers(createDefaultPlayers());
    setSelectedMap("forest");
    setFinishOrder([]);
    setPhase("setup");
  }

  // ── 결과 화면에서 플레이어 이름 찾기 ──────────────────────────────────────
  function getPlayerName(id: number): string {
    return players.find((p) => p.id === id)?.name ?? `플레이어 ${id + 1}`;
  }

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="동물 달리기"
      description="최대 8마리의 동물이 달리는 3D 레이스! 커피 살 사람은 꼴찌~"
      icon={Rabbit}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          설정 화면 (setup phase)
      ══════════════════════════════════════════════════════════════════════ */}
      {phase === "setup" && (
        <div className="mx-auto max-w-2xl space-y-8">
          {/* 플레이어 설정 */}
          <section className="rounded-2xl border border-border bg-bg-secondary p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">
              🐾 참가 동물 설정
            </h2>
            <div className="space-y-3">
              {players.map((player, idx) => (
                <div key={player.id} className="flex items-center gap-3">
                  {/* 동물 이모지 */}
                  <span className="text-2xl w-8 text-center select-none">
                    {ANIMALS[idx]?.emoji ?? "🐾"}
                  </span>
                  {/* 이름 입력 */}
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleNameChange(player.id, e.target.value)}
                    placeholder={`플레이어 ${idx + 1}`}
                    maxLength={12}
                    className="flex-1 rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  {/* 제거 버튼 (3명 이상일 때만 표시) */}
                  {players.length > 2 && (
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="flex size-9 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:border-red-400 hover:text-red-400"
                      aria-label="플레이어 제거"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 플레이어 추가 버튼 (8명 미만일 때만 표시) */}
            {players.length < 8 && (
              <button
                onClick={handleAddPlayer}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-text-secondary transition-colors hover:border-brand hover:text-brand"
              >
                <span className="text-lg">+</span>
                동물 추가하기 ({players.length}/8)
              </button>
            )}
          </section>

          {/* 맵 선택 */}
          <section className="rounded-2xl border border-border bg-bg-secondary p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">
              🗺️ 레이스 맵 선택
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* 숲 속 레이스 */}
              <button
                onClick={() => setSelectedMap("forest")}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all ${
                  selectedMap === "forest"
                    ? "border-brand bg-brand/10 shadow-lg shadow-brand/10"
                    : "border-border hover:border-brand/40"
                }`}
              >
                <span className="text-5xl">🌲</span>
                <div className="text-center">
                  <p className="font-bold text-text-primary">숲 속 레이스</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    나무 사이를 달려라!
                  </p>
                </div>
                {selectedMap === "forest" && (
                  <span className="rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
                    선택됨
                  </span>
                )}
              </button>

              {/* 사막 질주 */}
              <button
                onClick={() => setSelectedMap("desert")}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all ${
                  selectedMap === "desert"
                    ? "border-brand bg-brand/10 shadow-lg shadow-brand/10"
                    : "border-border hover:border-brand/40"
                }`}
              >
                <span className="text-5xl">🌵</span>
                <div className="text-center">
                  <p className="font-bold text-text-primary">사막 질주</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    뜨거운 모래 위를 달려라!
                  </p>
                </div>
                {selectedMap === "desert" && (
                  <span className="rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
                    선택됨
                  </span>
                )}
              </button>
            </div>
          </section>

          {/* 레이스 시작 버튼 */}
          <button
            onClick={handleStartRace}
            className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white shadow-lg shadow-brand/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            🏁 레이스 시작!
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          레이싱 화면 (racing phase)
      ══════════════════════════════════════════════════════════════════════ */}
      {phase === "racing" && (
        <div className="w-full">
          <AnimalRaceScene
            players={players}
            map={selectedMap}
            onFinish={handleRaceFinish}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          결과 화면 (result phase)
      ══════════════════════════════════════════════════════════════════════ */}
      {phase === "result" && (
        <div className="mx-auto max-w-lg space-y-6">
          {/* 타이틀 */}
          <div className="text-center">
            <h2 className="text-3xl font-black text-text-primary">
              🏁 결과 발표!
            </h2>
          </div>

          {/* 꼴찌 커피 당번 강조 */}
          {finishOrder.length > 0 && (
            <div className="rounded-2xl border-2 border-red-400 bg-red-50/10 p-6 text-center">
              <p className="text-4xl">☕</p>
              <p className="mt-2 text-xl font-black text-red-400">
                {getPlayerName(finishOrder[finishOrder.length - 1])}님이 커피 사세요!
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                꼴찌가 오늘의 커피 당번입니다 😂
              </p>
            </div>
          )}

          {/* 전체 순위 목록 */}
          <div className="rounded-2xl border border-border bg-bg-secondary p-6">
            <h3 className="mb-4 font-bold text-text-primary">📊 전체 순위</h3>
            <ol className="space-y-3">
              {finishOrder.map((playerId, rankIdx) => {
                const isLast = rankIdx === finishOrder.length - 1;
                const badgeClass =
                  RANK_BADGE_CLASSES[rankIdx] ?? RANK_BADGE_CLASSES[3];
                const animalEmoji = ANIMALS[playerId]?.emoji ?? "🐾";

                return (
                  <li
                    key={playerId}
                    className={`flex items-center gap-4 rounded-xl px-4 py-3 ${
                      isLast
                        ? "bg-red-50/10 ring-1 ring-red-400/40"
                        : "bg-white/5"
                    }`}
                  >
                    {/* 순위 뱃지 */}
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${badgeClass}`}
                    >
                      {rankIdx + 1}
                    </span>
                    {/* 동물 이모지 */}
                    <span className="text-xl">{animalEmoji}</span>
                    {/* 플레이어 이름 */}
                    <span
                      className={`flex-1 font-semibold ${
                        isLast ? "text-red-400" : "text-text-primary"
                      }`}
                    >
                      {getPlayerName(playerId)}
                    </span>
                    {/* 꼴찌 표시 */}
                    {isLast && (
                      <span className="text-sm text-red-400">☕ 커피당번</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* 다시 하기 버튼 */}
          <button
            onClick={handleRestart}
            className="w-full rounded-2xl border-2 border-brand py-4 text-lg font-bold text-brand transition-all hover:bg-brand hover:text-white active:scale-[0.98]"
          >
            🔄 다시 하기
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}