import type { LucideIcon } from "lucide-react";
import {
  Pipette,
  Palette,
  Layers,
  Type,
  LayoutGrid,
  Shapes,
  Binary,
  ShieldCheck,
  Link2,
  Languages,
  FileText,
  ImageIcon,
  Music,
  Film,
  Baseline,
  FileOutput,
} from "lucide-react";

export interface ToolItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: "NEW" | "인기";
}

export const DESIGN_TOOLS: ToolItem[] = [
  {
    id: "icon-library",
    label: "아이콘 라이브러리",
    description: "무료 SVG 아이콘 검색 및 React / SVG 코드 복사",
    href: "/tools/design/icon-library",
    icon: Shapes,
  },
  {
    id: "font-preview",
    label: "폰트 미리보기",
    description: "다양한 웹폰트 조합 및 스타일 시각화",
    href: "/tools/design/font-preview",
    icon: Type,
  },
  {
    id: "grid-generator",
    label: "그리드 / 레이아웃 생성기",
    description: "CSS Flexbox / Grid 코드 자동 생성",
    href: "/tools/design/grid-generator",
    icon: LayoutGrid,
  },
  {
    id: "color-picker",
    label: "Color Picker",
    description: "HEX ↔ RGB ↔ HSL 변환 및 색상 시각화",
    href: "/tools/design/color-picker",
    icon: Pipette,
  },
  {
    id: "color-palette",
    label: "Color Palette Generator",
    description: "입력 색상 기반 보색·유사색·삼색 팔레트 생성",
    href: "/tools/design/color-palette",
    icon: Palette,
  },
  {
    id: "gradient-generator",
    label: "Gradient / CSS Generator",
    description: "색상 조합으로 그라데이션 CSS 코드 즉시 생성",
    href: "/tools/design/gradient-generator",
    icon: Layers,
  },
];

export const ENCODE_DECODE_TOOLS: ToolItem[] = [
  {
    id: "base-encoder",
    label: "Base 인코더 / 디코더",
    description: "Base32 · Base58 · Base64 인코딩 및 디코딩",
    href: "/tools/encode-decode/base-encoder",
    icon: Binary,
    badge: "NEW",
  },
  {
    id: "crypto-tool",
    label: "암호화 / 복호화",
    description: "AES-256 · RSA-2048 대칭 및 비대칭 암호화 테스트",
    href: "/tools/encode-decode/crypto-tool",
    icon: ShieldCheck,
    badge: "NEW",
  },
  {
    id: "url-shortener",
    label: "URL 단축기",
    description: "긴 URL을 짧은 링크로 즉시 변환",
    href: "/tools/encode-decode/url-shortener",
    icon: Link2,
    badge: "NEW",
  },
];

export const TEXT_TOOLS: ToolItem[] = [
  {
    id: "lang-detector",
    label: "언어 감지 / 번역",
    description: "텍스트 언어 자동 감지 및 10개 언어 번역",
    href: "/tools/text/lang-detector",
    icon: Languages,
    badge: "NEW",
  },
  {
    id: "summarizer",
    label: "문장 요약 / 키워드 추출",
    description: "긴 글에서 핵심 문장과 주요 키워드 자동 추출",
    href: "/tools/text/summarizer",
    icon: FileText,
    badge: "NEW",
  },
  {
    id: "alt-text",
    label: "대체 텍스트 생성기",
    description: "이미지 설명용 alt 텍스트 작성 가이드 및 접근성 향상",
    href: "/tools/text/alt-text",
    icon: ImageIcon,
    badge: "NEW",
  },
];

export const CONVERTER_TOOLS: ToolItem[] = [
  {
    id: "audio-converter",
    label: "오디오 변환기",
    description: "MP3·WAV·OGG 등 오디오를 WAV로 변환 및 미리보기",
    href: "/tools/converter/audio-converter",
    icon: Music,
    badge: "NEW",
  },
  {
    id: "video-converter",
    label: "비디오 압축기",
    description: "MP4·WebM 해상도·화질 압축 및 WebM 포맷 변환",
    href: "/tools/converter/video-converter",
    icon: Film,
    badge: "NEW",
  },
  {
    id: "font-converter",
    label: "폰트 변환기",
    description: "TTF·OTF → WOFF 변환 및 CSS @font-face 코드 생성",
    href: "/tools/converter/font-converter",
    icon: Baseline,
    badge: "NEW",
  },
  {
    id: "doc-converter",
    label: "문서 변환기",
    description: "이미지 → PDF 변환 및 PDF → 이미지 추출",
    href: "/tools/converter/doc-converter",
    icon: FileOutput,
    badge: "NEW",
  },
  {
    id: "image-converter",
    label: "이미지 변환기",
    description: "JPEG·PNG·WebP·SVG 포맷 변환, 압축, 리사이즈, 배경 제거",
    href: "/tools/converter/image-converter",
    icon: ImageIcon,
    badge: "NEW",
  },
];

/** 카테고리 ID → 도구 목록 맵 */
export const TOOLS_BY_CATEGORY: Record<string, ToolItem[]> = {
  design: DESIGN_TOOLS,
  "encode-decode": ENCODE_DECODE_TOOLS,
  text: TEXT_TOOLS,
  converter: CONVERTER_TOOLS,
};