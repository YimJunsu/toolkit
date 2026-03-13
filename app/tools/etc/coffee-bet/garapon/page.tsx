"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { Gamepad2, Plus, Minus, RotateCcw, Coffee } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

// ─────────────────────────────────────────────────────────────────────────────
// 플레이어 인터페이스 (scene.tsx에서도 import해서 사용)
// ─────────────────────────────────────────────────────────────────────────────
export interface Player {
  id: number;
  name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 씬 컴포넌트 동적 임포트 (SSR 비활성화)
// ─────────────────────────────────────────────────────────────────────────────
const GaraponScene = dynamic(() => import("./scene"), { ssr: false });

// ─────────────────────────────────────────────────────────────────────────────
// 상수 & 타입
// ─────────────────────────────────────────────────────────────────────────────
type GamePhase = "setup" | "spinning" | "result";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
  { label: "커피내기 컬렉션", href: "/tools/etc/coffee-bet" },
];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

let nextId = 1;

function makePlayer(name = ""): Player {
  return { id: nextId++, name };
}

// ─────────────────────────────────────────────────────────────────────────────
// 기본 플레이어 목록 (2명)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PLAYERS: Player[] = [makePlayer("플레이어 1"), makePlayer("플레이어 2")];

// ─────────────────────────────────────────────────────────────────────────────
// 메인 페이지 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export default function GaraponPage() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [loserId, setLoserId] = useState<number | null>(null);

  // ── 플레이어 추가 ──────────────────────────────────────────────────────────
  const addPlayer = useCallback(() => {
    if (players.length >= MAX_PLAYERS) return;
    setPlayers((prev) => [
      ...prev,
      makePlayer(`플레이어 ${prev.length + 1}`),
    ]);
  }, [players.length]);

  // ── 플레이어 제거 ──────────────────────────────────────────────────────────
  const removePlayer = useCallback(
    (id: number) => {
      if (players.length <= MIN_PLAYERS) return;
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    },
    [players.length]
  );

  // ── 이름 변경 ──────────────────────────────────────────────────────────────
  const updateName = useCallback((id: number, name: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  }, []);

  // ── 게임 시작 ──────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    // 빈 이름 자동 채우기
    setPlayers((prev) =>
      prev.map((p, i) => ({
        ...p,
        name: p.name.trim() || `플레이어 ${i + 1}`,
      }))
    );
    setPhase("spinning");
  }, []);

  // ── 결과 수신 (scene에서 콜백) ────────────────────────────────────────────
  const handleResult = useCallback((id: number) => {
    setLoserId(id);
    setPhase("result");
  }, []);

  // ── 다시 하기 ──────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    setPhase("setup");
    setLoserId(null);
  }, []);

  const loser = players.find((p) => p.id === loserId);

  // ─────────────────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="가라폰"
      description="핸들을 돌려서 커피 살 사람을 뽑아보세요! 3D 일본식 가라폰 구슬 뽑기 머신."
      icon={Gamepad2}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          SETUP 페이즈
      ═══════════════════════════════════════════════════════════════════ */}
      {phase === "setup" && (
        <div className="mx-auto max-w-lg space-y-8">
          {/* 제목 카드 */}
          <div className="rounded-2xl border border-border bg-bg-secondary p-6 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-text-primary">
              가라폰 (구슬 뽑기)
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              핸들을 돌려서 커피 살 사람을 뽑아보세요!
            </p>
          </div>

          {/* 플레이어 입력 */}
          <div className="rounded-2xl border border-border bg-bg-secondary p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">
                참가자 ({players.length}/{MAX_PLAYERS}명)
              </h3>
              <button
                onClick={addPlayer}
                disabled={players.length >= MAX_PLAYERS}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={14} />
                참가자 추가
              </button>
            </div>

            <div className="space-y-2.5">
              {players.map((player, idx) => (
                <div key={player.id} className="flex items-center gap-2.5">
                  {/* 번호 배지 */}
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{
                      backgroundColor: [
                        "#ff4444",
                        "#44aaff",
                        "#44cc44",
                        "#ffaa00",
                        "#ff44ff",
                        "#00bbcc",
                        "#ff8800",
                        "#8844ff",
                      ][idx % 8],
                    }}
                  >
                    {idx + 1}
                  </span>

                  {/* 이름 입력 */}
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updateName(player.id, e.target.value)}
                    placeholder={`플레이어 ${idx + 1}`}
                    maxLength={10}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />

                  {/* 제거 버튼 */}
                  <button
                    onClick={() => removePlayer(player.id)}
                    disabled={players.length <= MIN_PLAYERS}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="참가자 제거"
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* 꽝 안내 */}
            <div className="mt-4 rounded-lg border border-dashed border-border bg-bg-primary px-4 py-3 text-center">
              <p className="text-xs text-text-secondary">
                ☕ 뽑힌 한 명이 <strong className="text-text-primary">꽝!</strong> — 커피를 사게 됩니다.
              </p>
            </div>
          </div>

          {/* 시작 버튼 */}
          <button
            onClick={startGame}
            className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
          >
            기계 작동 시작
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SPINNING 페이즈
      ═══════════════════════════════════════════════════════════════════ */}
      {phase === "spinning" && (
        <div className="mx-auto max-w-2xl space-y-4">
          <GaraponScene players={players} onResult={handleResult} />

          {/* 참가자 목록 미리보기 */}
          <div className="rounded-xl border border-border bg-bg-secondary p-4">
            <p className="mb-2 text-xs font-medium text-text-secondary">참가자</p>
            <div className="flex flex-wrap gap-2">
              {players.map((p, i) => (
                <span
                  key={p.id}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{
                    backgroundColor: [
                      "#ff4444",
                      "#44aaff",
                      "#44cc44",
                      "#ffaa00",
                      "#ff44ff",
                      "#00bbcc",
                      "#ff8800",
                      "#8844ff",
                    ][i % 8],
                  }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          RESULT 페이즈
      ═══════════════════════════════════════════════════════════════════ */}
      {phase === "result" && (
        <div className="mx-auto max-w-lg space-y-6">
          {/* 결과 발표 카드 */}
          <div className="overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-lg">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-center">
              <Coffee size={40} className="mx-auto mb-2 text-white" />
              <h2 className="text-2xl font-extrabold text-white">결과 발표!</h2>
            </div>

            {/* 당첨자 */}
            <div className="px-6 py-8 text-center">
              {loser ? (
                <>
                  <div className="mb-4 text-6xl">☕</div>
                  <p className="text-xl font-semibold text-text-secondary">오늘의 커피 당번은...</p>
                  <p className="mt-3 text-4xl font-extrabold text-text-primary">
                    {loser.name}
                  </p>
                  <p className="mt-3 text-lg font-bold text-orange-500">
                    ☕ {loser.name}님! 커피 사세요!
                  </p>
                </>
              ) : (
                <p className="text-text-secondary">결과를 불러오는 중...</p>
              )}
            </div>

            {/* 전체 결과 */}
            <div className="border-t border-border px-6 pb-6">
              <p className="mb-3 text-sm font-semibold text-text-secondary">전체 결과</p>
              <div className="space-y-2">
                {players.map((p, i) => {
                  const isLoser = p.id === loserId;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                        isLoser
                          ? "border border-orange-400/40 bg-orange-500/10"
                          : "border border-border bg-bg-primary"
                      }`}
                    >
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{
                          backgroundColor: [
                            "#ff4444",
                            "#44aaff",
                            "#44cc44",
                            "#ffaa00",
                            "#ff44ff",
                            "#00bbcc",
                            "#ff8800",
                            "#8844ff",
                          ][i % 8],
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`flex-1 font-medium ${
                          isLoser ? "text-orange-500" : "text-text-primary"
                        }`}
                      >
                        {p.name}
                      </span>
                      <span className="text-sm">
                        {isLoser ? "☕ 꽝!" : "✅ 통과"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 다시 하기 */}
          <button
            onClick={resetGame}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-bg-secondary py-4 text-base font-semibold text-text-primary transition-colors hover:bg-bg-primary"
          >
            <RotateCcw size={18} />
            다시 하기
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}