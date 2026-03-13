"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DisposeOnUnmount – Canvas 언마운트 시 GPU 리소스 완전 해제
// Context Lost 방지 핵심: geometry/material/renderList 모두 dispose
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
}

// ─────────────────────────────────────────────────────────────────────────────
// 공 색상 (플레이어별 고유 색)
// ─────────────────────────────────────────────────────────────────────────────
const BALL_COLORS = [
  "#ff3333", "#3399ff", "#33dd55", "#ffaa00",
  "#ff44cc", "#00eeff", "#ff7700", "#9955ff",
];

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

// 래칫 틱 (30도마다)
function playRatchet(ctx: AudioContext) {
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.05);
  g.gain.setValueAtTime(0.18, ctx.currentTime);
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

// ─────────────────────────────────────────────────────────────────────────────
// MachineScene – Canvas 내부 컴포넌트
// useThree 접근 + 3D 기계 메시 + 원형 핸들 인터랙션
// ─────────────────────────────────────────────────────────────────────────────
interface MachineSceneProps {
  players: Player[];
  onResult: (loserId: number) => void;
  onProgressUpdate: (pct: number) => void;
}

function MachineScene({ players, onResult, onProgressUpdate }: MachineSceneProps) {
  const { camera, gl } = useThree();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const handleGroupRef   = useRef<THREE.Group>(null);
  const ballRefs         = useRef<(THREE.Mesh | null)[]>([]);
  const ballBasePos      = useRef<THREE.Vector3[]>([]);

  // ── 인터랙션 상태 refs (React state 아님 → 성능) ───────────────────────────
  const isDragging       = useRef(false);
  const lastAngle        = useRef<number | null>(null);  // null = 드래그 안 함
  const totalRotation    = useRef(0);                    // 누적 회전(라디안)
  const lastRatchetAngle = useRef(0);
  const TRIGGER_ROT      = Math.PI * 4;                  // 2바퀴 트리거

  // ── 배출 애니메이션 상태 refs ─────────────────────────────────────────────
  const ballReleased     = useRef(false);
  const loserIndex       = useRef(-1);
  const releaseProgress  = useRef(0);
  const resultCalled     = useRef(false);

  // ── AudioContext ref ───────────────────────────────────────────────────────
  const audioCtx = useRef<AudioContext | null>(null);

  // ── 공 초기 위치 & loser 선정 ─────────────────────────────────────────────
  useEffect(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < players.length; i++) {
      // 돔 중심 (0, 2.0, 0) 반경 1.2 구 내부에 랜덤 배치
      const r     = 0.4 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1); // 균일 구면 분포
      positions.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        2.0 + r * Math.cos(phi) * 0.65,
        r * Math.sin(phi) * Math.sin(theta),
      ));
    }
    ballBasePos.current = positions;
    loserIndex.current  = Math.floor(Math.random() * players.length);
  }, [players]);

  // ─────────────────────────────────────────────────────────────────────────
  // 원형 드래그 핵심 함수:
  // 화면 좌표(clientX/Y) → 피벗 기준 각도 계산 → 핸들 회전 적용
  // ─────────────────────────────────────────────────────────────────────────
  const calcPivotScreen = useCallback((): { px: number; py: number } | null => {
    const canvas = gl.domElement;
    const rect   = canvas.getBoundingClientRect();

    // 피벗 월드 좌표 (2.3, 0, 0) → NDC → 화면 픽셀 좌표
    const pivot  = new THREE.Vector3(2.3, 0, 0).project(camera);
    return {
      px: (pivot.x *  0.5 + 0.5) * rect.width  + rect.left,
      py: (pivot.y * -0.5 + 0.5) * rect.height + rect.top,
    };
  }, [camera, gl]);

  const applyDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current || ballReleased.current) return;

    const ps = calcPivotScreen();
    if (!ps) return;

    // atan2로 피벗 기준 각도 계산 (마우스 방향)
    const newAngle = Math.atan2(clientY - ps.py, clientX - ps.px);

    if (lastAngle.current !== null) {
      // 각도 차이 계산 (wrap-around 보정 → [-π, π])
      let delta = newAngle - lastAngle.current;
      if (delta >  Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;

      // 핸들 그룹 Z축 회전 (피벗에서 원형으로 회전)
      if (handleGroupRef.current) {
        handleGroupRef.current.rotation.z += delta;
      }

      // 누적 회전량 (절대값) 추적
      totalRotation.current += Math.abs(delta);

      // 진행도 퍼센트 업데이트
      const pct = Math.min((totalRotation.current / TRIGGER_ROT) * 100, 100);
      onProgressUpdate(pct);

      // 래칫 클릭 (π/6 = 30도 마다)
      const ratchetInterval = Math.PI / 6;
      if (totalRotation.current - lastRatchetAngle.current >= ratchetInterval) {
        lastRatchetAngle.current = totalRotation.current;
        if (audioCtx.current) playRatchet(audioCtx.current);
      }

      // 2바퀴 달성 → 공 배출 트리거
      if (totalRotation.current >= TRIGGER_ROT && !ballReleased.current) {
        ballReleased.current = true;
        isDragging.current   = false;
        lastAngle.current    = null;
        if (audioCtx.current) playRelease(audioCtx.current);
      }
    }

    lastAngle.current = newAngle;
  }, [calcPivotScreen, onProgressUpdate]);

  // ─────────────────────────────────────────────────────────────────────────
  // 포인터 다운 (r3f 이벤트 – 노브 메시에 연결)
  // ─────────────────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    isDragging.current = true;
    lastAngle.current  = null; // 각도를 다음 move에서 초기화

    // 첫 상호작용 시 AudioContext 활성화 (브라우저 정책)
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

  // 트레이 목표 위치 (공이 최종적으로 도달할 곳)
  const trayTarget = useMemo(() => new THREE.Vector3(0, -1.75, 2.2), []);

  // ─────────────────────────────────────────────────────────────────────────
  // useFrame: 공 부유 애니메이션 + 배출 공 이동
  // ─────────────────────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    ballRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const base = ballBasePos.current[i];
      if (!base) return;

      // 배출된 공이면 별도 처리
      if (ballReleased.current && i === loserIndex.current) return;

      // 배출 전: 구 내부에서 둥둥 떠다님 (각 공마다 다른 주파수/위상)
      const intensity = ballReleased.current ? 0 : 1;
      mesh.position.set(
        base.x + Math.sin(time * 0.9 + i * 1.7) * 0.09 * intensity,
        base.y + Math.cos(time * 0.7 + i * 1.1) * 0.11 * intensity,
        base.z + Math.sin(time * 0.8 + i * 1.3) * 0.09 * intensity,
      );
    });

    // 배출 공 이동 애니메이션 (1.5초 동안 트레이로 이동)
    if (ballReleased.current && loserIndex.current >= 0 && !resultCalled.current) {
      const mesh = ballRefs.current[loserIndex.current];
      if (mesh) {
        releaseProgress.current = Math.min(releaseProgress.current + delta / 1.5, 1);

        // easeOutBounce로 자연스럽게 떨어지는 효과
        const t = releaseProgress.current;
        const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
        mesh.position.lerpVectors(ballBasePos.current[loserIndex.current] ?? trayTarget, trayTarget, eased);

        if (releaseProgress.current >= 1) {
          resultCalled.current = true;
          if (audioCtx.current) playReveal(audioCtx.current);
          const loserId = players[loserIndex.current]?.id ?? players[0].id;
          onResult(loserId);
        }
      }
    }
  });

  // ── 머신 외관 재질 헬퍼 ────────────────────────────────────────────────────
  const metalGray    = <meshStandardMaterial color="#b8b8c4" metalness={0.75} roughness={0.25} />;
  const metalDark    = <meshStandardMaterial color="#888898" metalness={0.8}  roughness={0.2}  />;
  const metalGold    = <meshStandardMaterial color="#c8a030" metalness={0.85} roughness={0.15} />;
  const metalRed     = <meshStandardMaterial color="#cc2800" metalness={0.6}  roughness={0.3}  />;
  const metalRedBright = <meshStandardMaterial color="#ff4422" metalness={0.4} roughness={0.45} />;

  return (
    <>
      {/* ★ GPU 리소스 완전 해제 (Context Lost 방지) */}
      <DisposeOnUnmount />

      {/* ── 조명 설정 ─────────────────────────────────────────────────────── */}
      {/* 상단 스팟라이트: 기계에 드라마틱한 하이라이트 */}
      <spotLight position={[0, 10, 4]} intensity={3} angle={0.4} penumbra={0.5}
        castShadow target-position={[0, 0, 0]} />
      {/* 왼쪽 필 라이트: 부드러운 파란색 림 라이팅 */}
      <pointLight position={[-6, 3, 3]} intensity={1.2} color="#4466ff" />
      {/* 오른쪽 보조광 */}
      <pointLight position={[6, 4, -2]} intensity={0.8} color="#ffeecc" />
      {/* 전체 앰비언트 */}
      <ambientLight intensity={0.35} />

      {/* ── 바닥 플레인 (그림자 받음) ─────────────────────────────────────── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]}>
        <circleGeometry args={[5, 48]} />
        <meshStandardMaterial color="#111122" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* ── 발 4개 (앞뒤 좌우) ───────────────────────────────────────────── */}
      {([[-0.9, 0.8], [0.9, 0.8], [-0.9, -0.8], [0.9, -0.8]] as [number,number][]).map(([fx, fz], i) => (
        <mesh key={i} position={[fx, -2.3, fz]} castShadow>
          <cylinderGeometry args={[0.1, 0.13, 0.7, 8]} />
          {metalDark}
        </mesh>
      ))}

      {/* ── 받침대 / 베이스 ──────────────────────────────────────────────── */}
      <mesh position={[0, -1.9, 0]} castShadow>
        <cylinderGeometry args={[2.0, 2.3, 0.45, 32]} />
        {metalDark}
      </mesh>
      {/* 받침대 상단 링 (장식) */}
      <mesh position={[0, -1.66, 0]}>
        <torusGeometry args={[1.95, 0.07, 12, 64]} />
        {metalGold}
      </mesh>

      {/* ── 본체 하단 좁아지는 넥(목) 부분 ──────────────────────────────── */}
      <mesh position={[0, -1.0, 0]} castShadow>
        <cylinderGeometry args={[0.6, 1.9, 0.7, 32]} />
        {metalGray}
      </mesh>

      {/* ── 메인 바디 (원통) ─────────────────────────────────────────────── */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[1.75, 1.75, 2.2, 32]} />
        {metalGray}
      </mesh>

      {/* ── 바디 중간 장식 밴드 ──────────────────────────────────────────── */}
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[1.76, 0.05, 10, 64]} />
        {metalGold}
      </mesh>
      {/* 위쪽 밴드 */}
      <mesh position={[0, 0.8, 0]}>
        <torusGeometry args={[1.76, 0.05, 10, 64]} />
        {metalGold}
      </mesh>
      {/* 아래쪽 밴드 */}
      <mesh position={[0, -0.6, 0]}>
        <torusGeometry args={[1.76, 0.05, 10, 64]} />
        {metalGold}
      </mesh>

      {/* ── 앞면 패널 (이름판 역할의 볼록한 사각형) ─────────────────────── */}
      <mesh position={[0, 0.1, 1.73]} castShadow>
        <boxGeometry args={[1.2, 1.4, 0.08]} />
        <meshStandardMaterial color="#1a1a3a" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* 패널 테두리 (금색 라인) */}
      <mesh position={[0, 0.1, 1.74]}>
        <ringGeometry args={[0.58, 0.65, 4, 1, Math.PI / 4]} />
        {metalGold}
      </mesh>

      {/* ── 동전 투입구 (하단 앞면) ─────────────────────────────────────── */}
      <mesh position={[0, -0.65, 1.74]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* 투입구 테두리 링 */}
      <mesh position={[0, -0.65, 1.75]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.03, 8, 24]} />
        {metalGold}
      </mesh>

      {/* ── 바디와 돔 연결부 넥 ──────────────────────────────────────────── */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.7, 0.4, 32]} />
        {metalGray}
      </mesh>

      {/* ── 돔 하단 플랜지 링 (금색) ─────────────────────────────────────── */}
      <mesh position={[0, 1.65, 0]}>
        <torusGeometry args={[1.28, 0.12, 14, 64]} />
        {metalGold}
      </mesh>

      {/* ── 유리 돔 (투명 구) ─────────────────────────────────────────────── */}
      {/* 외부: 반투명 파란 유리 */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[1.9, 40, 40]} />
        <meshStandardMaterial
          color="#99ccff" transparent opacity={0.18}
          metalness={0.1} roughness={0} side={THREE.FrontSide} />
      </mesh>
      {/* 내부: 반사감 강조 */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[1.88, 36, 36]} />
        <meshStandardMaterial
          color="#aaddff" transparent opacity={0.08}
          metalness={0.0} roughness={0} side={THREE.BackSide} />
      </mesh>

      {/* ── 돔 상단 마감 캡 ──────────────────────────────────────────────── */}
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
      {/* 기계 오른쪽 측면에 고정된 기어 판 */}
      <mesh position={[1.77, 0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.12, 24]} />
        {metalDark}
      </mesh>
      {/* 기어 판 장식 구멍 4개 */}
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
      {/* 기어 판 중앙 볼트 */}
      <mesh position={[1.77, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 12]} />
        {metalGold}
      </mesh>

      {/* ── 핸들 그룹 (피벗: [2.3, 0.1, 0], Z축 회전) ───────────────────── */}
      <group ref={handleGroupRef} position={[2.3, 0.1, 0]}>
        {/* 핸들 암 (피벗 → 노브 방향으로 뻗어있음) */}
        <mesh position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1.5, 12]} />
          {metalRed}
        </mesh>
        {/* 노브 연결부 (짧은 Z축 핀) */}
        <mesh position={[1.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.3, 12]} />
          {metalRed}
        </mesh>
        {/* 노브 구체 (클릭 가능 영역) */}
        <mesh
          position={[1.5, 0, 0.22]}
          ref={(el) => { /* knob ref – 클릭 감지용 */ void el; }}
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

      {/* ── 핸들 커버 (기계 옆면 패널) ──────────────────────────────────── */}
      <mesh position={[1.77, 0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <ringGeometry args={[0.46, 0.55, 24]} />
        {metalGold}
      </mesh>

      {/* ── 배출구 슈트 (앞쪽 비스듬히) ─────────────────────────────────── */}
      <mesh position={[0, -1.05, 1.2]} rotation={[-0.75, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 1.4, 16]} />
        {metalDark}
      </mesh>
      {/* 슈트 끝 테두리 링 */}
      <mesh position={[0, -1.68, 1.88]} rotation={[-0.75, 0, 0]}>
        <torusGeometry args={[0.3, 0.05, 10, 24]} />
        {metalGold}
      </mesh>

      {/* ── 트레이 (공이 굴러오는 받침대) ───────────────────────────────── */}
      <mesh position={[0, -1.85, 2.2]} castShadow>
        <boxGeometry args={[1.3, 0.08, 0.9]} />
        {metalDark}
      </mesh>
      {/* 트레이 앞면 칸막이 */}
      <mesh position={[0, -1.65, 2.62]}>
        <boxGeometry args={[1.3, 0.42, 0.06]} />
        {metalDark}
      </mesh>
      {/* 트레이 양 옆 칸막이 */}
      {[-0.63, 0.63].map((x, i) => (
        <mesh key={i} position={[x, -1.65, 2.38]}>
          <boxGeometry args={[0.06, 0.42, 0.46]} />
          {metalDark}
        </mesh>
      ))}
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
export default function GaraponScene({ players, onResult }: Props) {
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

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
        style={{ height: "520px", width: "100%", borderRadius: "16px" }}
        shadows
      >
        {/* 어두운 배경 */}
        <color attach="background" args={["#0d0d1e"]} />
        <MachineScene players={players} onResult={onResult} onProgressUpdate={setProgress} />
      </Canvas>

      {/* ── 조작 안내 오버레이 ────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2
                      rounded-xl border border-white/15 bg-black/60 px-4 py-2.5
                      text-center backdrop-blur-sm">
        <p className="text-sm font-bold text-white">핸들을 2바퀴 돌리면 공이 나와요!</p>
        <p className="mt-0.5 text-xs text-white/65">
          {isMobile
            ? "🤙 빨간 노브를 손가락으로 원형으로 돌리세요"
            : "🖱 빨간 노브를 마우스로 원형으로 돌리세요"}
        </p>
      </div>

      {/* ── 회전 진행도 ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="relative flex items-center justify-center">
          <ProgressArc progress={progress} />
          <span className="absolute text-xs font-bold text-white">
            {Math.round(progress)}%
          </span>
        </div>
        <span className="rounded-lg border border-white/15 bg-black/55 px-3 py-1
                         text-xs text-white/80 backdrop-blur-sm">
          {progress >= 100
            ? <span className="animate-pulse text-green-400 font-semibold">✓ 공 배출 중!</span>
            : `회전량 ${Math.round(progress)}% — ${progress < 50 ? "더 돌려주세요" : "거의 다 됐어요!"}`
          }
        </span>
      </div>
    </div>
  );
}