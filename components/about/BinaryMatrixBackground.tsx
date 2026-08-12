"use client";

import { useEffect, useRef } from "react";

export function BinaryMatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const currentMouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const fontSize = 14;
    const cols = Math.floor(width / fontSize);
    const rows = Math.floor(height / fontSize);

    interface BinaryParticle {
      x: number;
      y: number;
      char: string;
      isHeadphoneShape: boolean;
      density: number;
    }

    const particles: BinaryParticle[] = [];
    const centerX = width / 2;
    const centerY = height * 0.42;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * fontSize;
        const y = r * fontSize;

        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 토스 헤드폰 아치 곡선 수학
        const isHeadband = Math.abs(dist - 210) < 24 && dy < 50;
        const isLeftEar = Math.abs(x - (centerX - 210)) < 38 && Math.abs(y - (centerY + 70)) < 58;
        const isRightEar = Math.abs(x - (centerX + 210)) < 38 && Math.abs(y - (centerY + 70)) < 58;

        const isHeadphone = isHeadband || isLeftEar || isRightEar;

        if (isHeadphone || Math.random() < 0.12) {
          particles.push({
            x,
            y,
            char: Math.random() > 0.5 ? "1" : "0",
            isHeadphoneShape: isHeadphone,
            density: isHeadphone ? 0.95 : 0.25,
          });
        }
      }
    }

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.022; // 파도 흐름 속도

      // 부드러운 마우스 이징
      currentMouse.current.x += (mousePos.current.x - currentMouse.current.x) * 0.12;
      currentMouse.current.y += (mousePos.current.y - currentMouse.current.y) * 0.12;

      const isDark = document.documentElement.getAttribute("data-theme") !== "light";
      const scrollY = window.scrollY;
      const heroOpacity = Math.max(0, 1 - scrollY / (window.innerHeight * 0.55));

      particles.forEach((p) => {
        // 아주 천천히 은은하게 0/1 토글
        if (Math.random() < 0.003) {
          p.char = p.char === "1" ? "0" : "1";
        }

        const dx = p.x - currentMouse.current.x;
        const dy = p.y - currentMouse.current.y;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        const mouseRadius = 240;

        // 🌊 파도타기 웨이브 수학 공식 (x, y 좌표 기반 사인파 오프셋)
        const waveX = Math.sin(p.x * 0.005 + time * 1.4);
        const waveY = Math.cos(p.y * 0.005 + time * 1.1);
        const waveFactor = (waveX + waveY + 2) / 4; // 0.0 ~ 1.0 파도 강도

        let alpha = 0;

        // 1. 상단 Hero 영역: 파도타는 듯한 은은한 물결(Sine Wave) 연출
        if (heroOpacity > 0.05 && p.isHeadphoneShape) {
          alpha = p.density * heroOpacity * (0.2 + 0.7 * waveFactor);
        }

        // 2. 마우스 스포트라이트 (부드러운 Easing Radial Dropoff)
        if (mouseDist < mouseRadius) {
          const mouseFactor = Math.pow(1 - mouseDist / mouseRadius, 2.2);
          alpha = Math.max(alpha, mouseFactor * 0.85);
        }

        if (alpha > 0.02) {
          ctx.font = `600 ${fontSize}px monospace`;
          if (isDark) {
            if (p.isHeadphoneShape && heroOpacity > 0.3) {
              // 파도 높이에 따라 실시간 빛의 세기가 은은하게 그라데이션 변화
              const waveCyan = Math.floor(180 + waveFactor * 75);
              ctx.fillStyle = `rgba(56, ${waveCyan}, 248, ${alpha})`;
            } else {
              ctx.fillStyle = `rgba(96, 165, 250, ${alpha * 0.9})`;
            }
          } else {
            ctx.fillStyle = `rgba(26, 115, 232, ${alpha * 0.85})`;
          }
          ctx.fillText(p.char, p.x, p.y);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90 transition-opacity duration-500"
    />
  );
}
