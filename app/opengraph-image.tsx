import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "tool.kit — 무료 개발자 도구 모음";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* 배경 장식 */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.15)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.10)",
            filter: "blur(80px)",
          }}
        />

        {/* 배지 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: 999,
            padding: "6px 18px",
            marginBottom: 32,
            color: "#a5b4fc",
            fontSize: 18,
            background: "rgba(99,102,241,0.1)",
          }}
        >
          🧰 tool.kit
        </div>

        {/* 메인 타이틀 */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          무료 개발자 도구
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#6366f1",
            letterSpacing: "-2px",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 32,
          }}
        >
          한 곳에서
        </div>

        {/* 설명 */}
        <div
          style={{
            fontSize: 24,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          JSON, Base64, UUID, QR코드, 색상 변환 등 50+ 온라인 도구
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#52525b",
          }}
        >
          mytool-kit.netlify.app
        </div>
      </div>
    ),
    { ...size }
  );
}
