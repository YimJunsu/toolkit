"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DisposeOnUnmount – Canvas 언마운트 시 GPU 리소스 완전 해제
// ─────────────────────────────────────────────────────────────────────────────
function DisposeOnUnmount() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => { e.preventDefault(); };
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl]);

  useEffect(() => {
    return () => {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => (m as THREE.Material).dispose());
        } else {
          (mesh.material as THREE.Material)?.dispose();
        }
      });
      gl.renderLists.dispose();
      gl.dispose();
    };
  }, [gl, scene]);

  return null;
}

import type { ThreeEvent } from "@react-three/fiber";
import type { Player } from "./page";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  players: Player[];
  onResult: (loserId: number) => void;
  targetPlayerId?: number; // 지정된 경우 해당 플레이어의 공이 배출됨
}

// ─────────────────────────────────────────────────────────────────────────────
// 공 색상 (플레이어별 고유 색)
// ─────────────────────────────────────────────────────────────────────────────
const BALL_COLORS = [
  "#ff3333", "#3399ff", "#33dd55", "#ffaa00",
  "#ff44cc", "#00eeff", "#ff7700", "#9955ff",
];

// ─────────────────────────────────────────────────────────────────────────────
// 회전 트리거 & 서스펜스 설정
// ─────────────────────────────────────────────────────────────────────────────
const TRIGGER_ROT      = Math.PI * 6;   // 3바퀴 (기존 2바퀴 → 증가)
const SUSPENSE_DURATION = 1.8;           // 공 배출 전 긴장감 지속 시간(초)

// ─────────────────────────────────────────────────────────────────────────────
// Web Audio API 사운드 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
function makeAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch { return null; }
}

// 래칫 틱 – 진행도에 따라 음조 상승
function playRatchet(ctx: AudioContext, intensity = 0) {
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  const baseFreq = 350 + intensity * 200;
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05);
  g.gain.setValueAtTime(0.15 + intensity * 0.1, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
  osc.start(); osc.stop(ctx.currentTime + 0.07);
}

// 공 배출 사운드
function playRelease(ctx: AudioContext) {
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(500, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.6);
  g.gain.setValueAtTime(0.3, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
  osc.start(); osc.stop(ctx.currentTime + 0.7);
}

// 결과 공개 스파클
function playReveal(ctx: AudioContext) {
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    const t = ctx.currentTime + i * 0.09;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.start(t); osc.stop(t + 0.18);
  });
}

// 드럼롤 한 타 (서스펜스 중 점점 빨라짐)
function playDrumrollHit(ctx: AudioContext, intensity: number) {
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(70 + intensity * 40, ctx.currentTime);
  g.gain.setValueAtTime(0.18 + intensity * 0.12, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.055);
  osc.start(); osc.stop(ctx.currentTime + 0.055);
}

// ─────────────────────────────────────────────────────────────────────────────
// CameraController – 모바일 여부에 따라 카메라 위치·FOV 실시간 조정
// ─────────────────────────────────────────────────────────────────────────────
function CameraController({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (isMobile) {
      // 오른쪽으로 이동: 핸들(x≈3.8)이 화면에 들어오도록
      camera.position.set(1.5, 0.8, 7);
      cam.fov = 62;
    } else {
      camera.position.set(0, 1.2, 8);
      cam.fov = 52;
    }
    cam.updateProjectionMatrix();
  }, [camera, isMobile]);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MachineScene – Canvas 내부 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
interface MachineSceneProps {
  players: Player[];
  onResult: (loserId: number) => void;
  onProgressUpdate: (pct: number) => void;
  onSuspenseChange: (active: boolean) => void;
  isMobile: boolean;
  targetPlayerId?: number;
}

function MachineScene({ players, onResult, onProgressUpdate, onSuspenseChange, isMobile, targetPlayerId }: MachineSceneProps) {
  const { camera, gl } = useThree();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const handleGroupRef   = useRef<THREE.Group>(null);
  const ballRefs         = useRef<(THREE.Mesh | null)[]>([]);
  const ballBasePos      = useRef<THREE.Vector3[]>([]);

  // ── 인터랙션 상태 refs ────────────────────────────────────────────────────
  const isDragging       = useRef(false);
  const lastAngle        = useRef<number | null>(null);
  const totalRotation    = useRef(0);
  const lastRatchetAngle = useRef(0);

  // ── 배출 애니메이션 상태 refs ─────────────────────────────────────────────
  const ballReleased     = useRef(false);
  const loserIndex       = useRef(-1);
  const releaseProgress  = useRef(0);
  const resultCalled     = useRef(false);

  // ── 서스펜스 페이즈 refs (NEW) ─────────────────────────────────────────────
  const suspenseActive   = useRef(false);
  const suspenseTimer    = useRef(0);
  const drumrollTimer    = useRef(0);

  // ── AudioContext ref ───────────────────────────────────────────────────────
  const audioCtx = useRef<AudioContext | null>(null);

  // ── 공 초기 위치 & loser 선정 ─────────────────────────────────────────────
  useEffect(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < players.length; i++) {
      const r     = 0.4 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      positions.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        2.0 + r * Math.cos(phi) * 0.65,
        r * Math.sin(phi) * Math.sin(theta),
      ));
    }
    ballBasePos.current = positions;
    if (targetPlayerId !== undefined) {
      const idx = players.findIndex(p => p.id === targetPlayerId);
      loserIndex.current = idx >= 0 ? idx : Math.floor(Math.random() * players.length);
    } else {
      loserIndex.current = Math.floor(Math.random() * players.length);
    }
  }, [players, targetPlayerId]);

  // ─────────────────────────────────────────────────────────────────────────
  // 원형 드래그: 피벗 기준 각도 계산
  // ─────────────────────────────────────────────────────────────────────────
  const calcPivotScreen = useCallback((): { px: number; py: number } | null => {
    const canvas = gl.domElement;
    const rect   = canvas.getBoundingClientRect();
    const pivot  = new THREE.Vector3(2.3, 0, 0).project(camera);
    return {
      px: (pivot.x *  0.5 + 0.5) * rect.width  + rect.left,
      py: (pivot.y * -0.5 + 0.5) * rect.height + rect.top,
    };
  }, [camera, gl]);

  const applyDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current || ballReleased.current || suspenseActive.current) return;

    const ps = calcPivotScreen();
    if (!ps) return;

    const newAngle = Math.atan2(clientY - ps.py, clientX - ps.px);

    if (lastAngle.current !== null) {
      let delta = newAngle - lastAngle.current;
      if (delta >  Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;

      if (handleGroupRef.current) {
        handleGroupRef.current.rotation.z += delta;
      }

      totalRotation.current += Math.abs(delta);

      const pct = Math.min((totalRotation.current / TRIGGER_ROT) * 100, 100);
      onProgressUpdate(pct);

      // 래칫 클릭 – 진행도에 따라 음조 변화
      const ratchetInterval = Math.PI / 6;
      if (totalRotation.current - lastRatchetAngle.current >= ratchetInterval) {
        lastRatchetAngle.current = totalRotation.current;
        const intensity = Math.min(totalRotation.current / TRIGGER_ROT, 1);
        if (audioCtx.current) playRatchet(audioCtx.current, intensity);
      }

      // 3바퀴 달성 → 서스펜스 페이즈 시작
      if (totalRotation.current >= TRIGGER_ROT && !suspenseActive.current && !ballReleased.current) {
        suspenseActive.current = true;
        suspenseTimer.current  = 0;
        drumrollTimer.current  = 0;
        isDragging.current     = false;
        lastAngle.current      = null;
        onSuspenseChange(true);
        if (audioCtx.current) playRelease(audioCtx.current);
      }
    }

    lastAngle.current = newAngle;
  }, [calcPivotScreen, onProgressUpdate, onSuspenseChange]);

  // ─────────────────────────────────────────────────────────────────────────
  // 포인터 다운
  // ─────────────────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (ballReleased.current || suspenseActive.current) return;
    isDragging.current = true;
    lastAngle.current  = null;

    if (!audioCtx.current) {
      audioCtx.current = makeAudioCtx();
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 윈도우 레벨 이벤트 (Canvas 밖 드래그도 추적)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove  = (e: MouseEvent) => applyDrag(e.clientX, e.clientY);
    const onTouchMove  = (e: TouchEvent) => {
      if (e.touches[0]) applyDrag(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onPointerUp  = () => { isDragging.current = false; lastAngle.current = null; };

    window.addEventListener("mousemove",  onMouseMove);
    window.addEventListener("mouseup",    onPointerUp);
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    window.addEventListener("touchend",   onPointerUp);
    window.addEventListener("touchcancel",onPointerUp);

    return () => {
      window.removeEventListener("mousemove",  onMouseMove);
      window.removeEventListener("mouseup",    onPointerUp);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onPointerUp);
      window.removeEventListener("touchcancel",onPointerUp);
    };
  }, [applyDrag]);

  const trayTarget = useMemo(() => new THREE.Vector3(0, -1.75, 2.2), []);

  // ─────────────────────────────────────────────────────────────────────────
  // useFrame: 서스펜스 + 공 부유 + 배출 애니메이션
  // ─────────────────────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // === 서스펜스 페이즈: 모든 공 격렬히 흔들기 + 드럼롤 ===
    if (suspenseActive.current && !ballReleased.current) {
      suspenseTimer.current += delta;
      drumrollTimer.current += delta;

      const pct = Math.min(suspenseTimer.current / SUSPENSE_DURATION, 1);
      // 드럼롤 간격: 0.12s → 0.04s (점점 빠르게)
      const interval = Math.max(0.04, 0.12 - pct * 0.08);

      if (drumrollTimer.current >= interval) {
        drumrollTimer.current = 0;
        if (audioCtx.current) playDrumrollHit(audioCtx.current, pct);
      }

      // 공 격렬 진동
      ballRefs.current.forEach((mesh, i) => {
        if (!mesh) return;
        const base = ballBasePos.current[i];
        if (!base) return;
        const s = 0.08 + pct * 0.45;
        mesh.position.set(
          base.x + (Math.random() - 0.5) * s,
          base.y + (Math.random() - 0.5) * s,
          base.z + (Math.random() - 0.5) * s,
        );
      });

      if (suspenseTimer.current >= SUSPENSE_DURATION) {
        suspenseActive.current = false;
        ballReleased.current   = true;
        onSuspenseChange(false);
        if (audioCtx.current) playReveal(audioCtx.current);
      }
      return;
    }

    // === 일반 부유 (진행도에 따라 강도 증가) ===
    ballRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const base = ballBasePos.current[i];
      if (!base) return;

      if (ballReleased.current && i === loserIndex.current) return;
      if (ballReleased.current) {
        // 배출 후: 나머지 공은 제자리 정지
        mesh.position.set(base.x, base.y, base.z);
        return;
      }

      // 진행도 기반 진동 강도 (0% → 1x, 100% → 3.5x)
      const progressFactor = Math.min(totalRotation.current / TRIGGER_ROT, 1);
      const freq = 1 + progressFactor * 2.5;
      const amp  = 0.09 + progressFactor * 0.18;

      mesh.position.set(
        base.x + Math.sin(time * 0.9 * freq + i * 1.7) * amp,
        base.y + Math.cos(time * 0.7 * freq + i * 1.1) * amp * 1.22,
        base.z + Math.sin(time * 0.8 * freq + i * 1.3) * amp,
      );
    });

    // === 배출 공 이동 애니메이션 (1.5초 트레이로) ===
    if (ballReleased.current && loserIndex.current >= 0 && !resultCalled.current) {
      const mesh = ballRefs.current[loserIndex.current];
      if (mesh) {
        releaseProgress.current = Math.min(releaseProgress.current + delta / 1.5, 1);

        const t     = releaseProgress.current;
        const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
        mesh.position.lerpVectors(ballBasePos.current[loserIndex.current] ?? trayTarget, trayTarget, eased);

        if (releaseProgress.current >= 1) {
          resultCalled.current = true;
          const loserId = players[loserIndex.current]?.id ?? players[0].id;
          onResult(loserId);
        }
      }
    }
  });

  // ── 머신 외관 재질 헬퍼 ────────────────────────────────────────────────────
  const metalGray      = <meshStandardMaterial color="#b8b8c4" metalness={0.75} roughness={0.25} />;
  const metalDark      = <meshStandardMaterial color="#888898" metalness={0.8}  roughness={0.2}  />;
  const metalGold      = <meshStandardMaterial color="#c8a030" metalness={0.85} roughness={0.15} />;
  const metalRed       = <meshStandardMaterial color="#cc2800" metalness={0.6}  roughness={0.3}  />;
  const metalRedBright = <meshStandardMaterial color="#ff4422" metalness={0.4}  roughness={0.45} />;

  return (
    <>
      <DisposeOnUnmount />

      {/* ── 조명 ─────────────────────────────────────────────────────────── */}
      <spotLight position={[0, 10, 4]} intensity={3} angle={0.4} penumbra={0.5}
        castShadow target-position={[0, 0, 0]} />
      <pointLight position={[-6, 3, 3]} intensity={1.2} color="#4466ff" />
      <pointLight position={[6, 4, -2]} intensity={0.8} color="#ffeecc" />
      <ambientLight intensity={0.35} />

      {/* ── 바닥 ─────────────────────────────────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]}>
        <circleGeometry args={[5, 48]} />
        <meshStandardMaterial color="#111122" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* ── 발 4개 ───────────────────────────────────────────────────────── */}
      {([[-0.9, 0.8], [0.9, 0.8], [-0.9, -0.8], [0.9, -0.8]] as [number,number][]).map(([fx, fz], i) => (
        <mesh key={i} position={[fx, -2.3, fz]} castShadow>
          <cylinderGeometry args={[0.1, 0.13, 0.7, 8]} />
          {metalDark}
        </mesh>
      ))}

      {/* ── 받침대 ───────────────────────────────────────────────────────── */}
      <mesh position={[0, -1.9, 0]} castShadow>
        <cylinderGeometry args={[2.0, 2.3, 0.45, 32]} />
        {metalDark}
      </mesh>
      <mesh position={[0, -1.66, 0]}>
        <torusGeometry args={[1.95, 0.07, 12, 64]} />
        {metalGold}
      </mesh>

      {/* ── 본체 넥 ──────────────────────────────────────────────────────── */}
      <mesh position={[0, -1.0, 0]} castShadow>
        <cylinderGeometry args={[0.6, 1.9, 0.7, 32]} />
        {metalGray}
      </mesh>

      {/* ── 메인 바디 ────────────────────────────────────────────────────── */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[1.75, 1.75, 2.2, 32]} />
        {metalGray}
      </mesh>

      {/* ── 장식 밴드 ────────────────────────────────────────────────────── */}
      {[0.1, 0.8, -0.6].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[1.76, 0.05, 10, 64]} />
          {metalGold}
        </mesh>
      ))}

      {/* ── 앞면 패널 ────────────────────────────────────────────────────── */}
      <mesh position={[0, 0.1, 1.73]} castShadow>
        <boxGeometry args={[1.2, 1.4, 0.08]} />
        <meshStandardMaterial color="#1a1a3a" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 1.74]}>
        <ringGeometry args={[0.58, 0.65, 4, 1, Math.PI / 4]} />
        {metalGold}
      </mesh>

      {/* ── 동전 투입구 ──────────────────────────────────────────────────── */}
      <mesh position={[0, -0.65, 1.74]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.65, 1.75]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.03, 8, 24]} />
        {metalGold}
      </mesh>

      {/* ── 바디↔돔 연결 넥 ──────────────────────────────────────────────── */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.7, 0.4, 32]} />
        {metalGray}
      </mesh>

      {/* ── 돔 플랜지 링 ─────────────────────────────────────────────────── */}
      <mesh position={[0, 1.65, 0]}>
        <torusGeometry args={[1.28, 0.12, 14, 64]} />
        {metalGold}
      </mesh>

      {/* ── 유리 돔 ──────────────────────────────────────────────────────── */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[1.9, 40, 40]} />
        <meshStandardMaterial
          color="#99ccff" transparent opacity={0.18}
          metalness={0.1} roughness={0} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[1.88, 36, 36]} />
        <meshStandardMaterial
          color="#aaddff" transparent opacity={0.08}
          metalness={0.0} roughness={0} side={THREE.BackSide} />
      </mesh>

      {/* ── 돔 상단 캡 ───────────────────────────────────────────────────── */}
      <mesh position={[0, 4.67, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        {metalGold}
      </mesh>

      {/* ── 구슬 (플레이어 수만큼) ───────────────────────────────────────── */}
      {players.map((player, i) => (
        <mesh
          key={player.id}
          ref={(el) => { ballRefs.current[i] = el; }}
          position={
            ballBasePos.current[i]
              ? [ballBasePos.current[i].x, ballBasePos.current[i].y, ballBasePos.current[i].z]
              : [0, 2.8, 0]
          }
          castShadow
        >
          <sphereGeometry args={[0.22, 18, 18]} />
          <meshStandardMaterial
            color={BALL_COLORS[i % BALL_COLORS.length]}
            metalness={0.05} roughness={0.2}
            emissive={BALL_COLORS[i % BALL_COLORS.length]}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* ── 핸들 피벗 기어 디스크 ────────────────────────────────────────── */}
      <mesh position={[1.77, 0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.12, 24]} />
        {metalDark}
      </mesh>
      {[0, 1, 2, 3].map((n) => {
        const a = (n / 4) * Math.PI * 2;
        return (
          <mesh key={n} position={[1.77, 0.1 + Math.sin(a) * 0.26, Math.cos(a) * 0.26]}
            rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.14, 10]} />
            <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
      <mesh position={[1.77, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 12]} />
        {metalGold}
      </mesh>

      {/* ── 핸들 그룹 (피벗: [2.3, 0.1, 0], Z축 회전) ───────────────────── */}
      <group ref={handleGroupRef} position={[2.3, 0.1, 0]}>
        {/* 핸들 암 */}
        <mesh position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1.5, 12]} />
          {metalRed}
        </mesh>
        {/* 노브 연결 핀 */}
        <mesh position={[1.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.3, 12]} />
          {metalRed}
        </mesh>
        {/* 노브 구체 – 데스크톱 클릭 타겟 */}
        <mesh
          position={[1.5, 0, 0.22]}
          onPointerDown={handlePointerDown}
          castShadow
        >
          <sphereGeometry args={[0.28, 20, 20]} />
          {metalRedBright}
        </mesh>
        {/* 노브 장식 캡 */}
        <mesh position={[1.5, 0, 0.47]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          {metalGold}
        </mesh>
      </group>

      {/* ── 핸들 커버 링 ─────────────────────────────────────────────────── */}
      <mesh position={[1.77, 0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <ringGeometry args={[0.46, 0.55, 24]} />
        {metalGold}
      </mesh>

      {/* ── 배출구 슈트 ──────────────────────────────────────────────────── */}
      <mesh position={[0, -1.05, 1.2]} rotation={[-0.75, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 1.4, 16]} />
        {metalDark}
      </mesh>
      <mesh position={[0, -1.68, 1.88]} rotation={[-0.75, 0, 0]}>
        <torusGeometry args={[0.3, 0.05, 10, 24]} />
        {metalGold}
      </mesh>

      {/* ── 트레이 ───────────────────────────────────────────────────────── */}
      <mesh position={[0, -1.85, 2.2]} castShadow>
        <boxGeometry args={[1.3, 0.08, 0.9]} />
        {metalDark}
      </mesh>
      <mesh position={[0, -1.65, 2.62]}>
        <boxGeometry args={[1.3, 0.42, 0.06]} />
        {metalDark}
      </mesh>
      {[-0.63, 0.63].map((x, i) => (
        <mesh key={i} position={[x, -1.65, 2.38]}>
          <boxGeometry args={[0.06, 0.42, 0.46]} />
          {metalDark}
        </mesh>
      ))}

      {/* ── 모바일 전체 화면 터치 영역 (투명 평면) ───────────────────────── */}
      {isMobile && (
        <mesh position={[1.2, 0, 3.8]} onPointerDown={handlePointerDown}>
          <planeGeometry args={[20, 16]} />
          <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
        </mesh>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG 원형 진행도 표시기
// ─────────────────────────────────────────────────────────────────────────────
function ProgressArc({ progress }: { progress: number }) {
  const r   = 30;
  const c   = 2 * Math.PI * r;
  const off = c - (progress / 100) * c;
  const col = progress >= 100 ? "#22c55e" : progress >= 60 ? "#eab308" : "#3b82f6";

  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="rotate-[-90deg]">
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
      <circle cx="38" cy="38" r={r} fill="none" stroke={col} strokeWidth="7"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.08s, stroke 0.3s" }} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GaraponScene – 최상위 내보내기
// ─────────────────────────────────────────────────────────────────────────────
export default function GaraponScene({ players, onResult, targetPlayerId }: Props) {
  const [progressPct, setProgressPct] = useState(0);
  const [isMobile, setIsMobile]  = useState(false);
  const [suspense, setSuspenseOverlay] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="relative w-full select-none">
      {/* ── Three.js Canvas ───────────────────────────────────────────────── */}
      <Canvas
        camera={{ position: [0, 1.2, 8], fov: 52 }}
        style={{ height: isMobile ? "480px" : "520px", width: "100%", borderRadius: "16px" }}
        shadows
      >
        <color attach="background" args={["#0d0d1e"]} />
        <CameraController isMobile={isMobile} />
        <MachineScene
          players={players}
          onResult={onResult}
          onProgressUpdate={setProgressPct}
          onSuspenseChange={setSuspenseOverlay}
          isMobile={isMobile}
          targetPlayerId={targetPlayerId}
        />
      </Canvas>

      {/* ── 서스펜스 오버레이 (긴장감 연출) ─────────────────────────────── */}
      {suspense && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center
                        rounded-2xl bg-black/55 backdrop-blur-sm">
          <div className="text-center">
            <p className="animate-bounce text-5xl font-extrabold text-white drop-shadow-2xl">
              두근두근...
            </p>
            <p className="mt-3 animate-pulse text-xl font-bold text-yellow-300">
              ⚡ 공이 결정되고 있어요! ⚡
            </p>
          </div>
        </div>
      )}

      {/* ── 조작 안내 오버레이 ────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2
                      rounded-xl border border-white/15 bg-black/60 px-4 py-2.5
                      text-center backdrop-blur-sm">
        <p className="text-sm font-bold text-white">핸들을 3바퀴 돌리면 공이 나와요!</p>
        <p className="mt-0.5 text-xs text-white/65">
          {isMobile
            ? "🤙 화면 어디서든 손가락으로 원형으로 돌리세요"
            : "🖱 빨간 노브를 마우스로 원형으로 돌리세요"}
        </p>
      </div>

      {/* ── 회전 진행도 ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="relative flex items-center justify-center">
          <ProgressArc progress={progressPct} />
          <span className="absolute text-xs font-bold text-white">
            {Math.round(progressPct)}%
          </span>
        </div>
        <span className="rounded-lg border border-white/15 bg-black/55 px-3 py-1
                         text-xs text-white/80 backdrop-blur-sm">
          {suspense
            ? <span className="animate-pulse font-semibold text-yellow-300">🥁 두근두근 결정 중...</span>
            : progressPct >= 100
              ? <span className="animate-pulse font-semibold text-green-400">✓ 공 배출 중!</span>
              : `회전량 ${Math.round(progressPct)}% — ${progressPct < 50 ? "더 돌려주세요" : "거의 다 됐어요!"}`
          }
        </span>
      </div>
    </div>
  );
}
