/* ============================================================
   색상 변환 유틸리티
   Color Picker, Palette Generator 등 색상 도구에서 공용으로 사용
   ============================================================ */

export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }

/** HEX 유효성 검사 (#rrggbb 형식) */
export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/** HEX → RGB */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/** RGB → HEX */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** RGB → HSL (h: 0-360, s: 0-100, l: 0-100) */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
    case gn: h = (bn - rn) / d + 2; break;
    case bn: h = (rn - gn) / d + 4; break;
  }
  h /= 6;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** HSL → RGB */
export function hslToRgb(h: number, s: number, l: number): RGB {
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;

  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;

  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

/** HSL → HEX */
export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/** HEX → HSL */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

/** 배경색 대비에 따른 텍스트 색상 반환 */
export function getContrastColor(hex: string): "#ffffff" | "#000000" {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/* ── 팔레트 생성 ── */

export type PaletteType =
  | "monochromatic"
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary";

export interface PaletteColor {
  hex: string;
  label: string;
}

export function generatePalette(hex: string, type: PaletteType): PaletteColor[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];
  const { h, s, l } = hsl;

  switch (type) {
    case "monochromatic":
      return [10, 25, 40, 55, 70, 85].map((lightness) => ({
        hex: hslToHex(h, s, lightness),
        label: `L${lightness}`,
      }));

    case "complementary": {
      const comp = (h + 180) % 360;
      return [
        { hex: hslToHex(h, s, l - 20 < 0 ? l + 20 : l - 20), label: "Dark" },
        { hex: hslToHex(h, s, l), label: "Base" },
        { hex: hslToHex(h, s, l + 20 > 100 ? l - 10 : l + 20), label: "Light" },
        { hex: hslToHex(comp, s, l - 20 < 0 ? l + 20 : l - 20), label: "Comp Dark" },
        { hex: hslToHex(comp, s, l), label: "Complement" },
        { hex: hslToHex(comp, s, l + 20 > 100 ? l - 10 : l + 20), label: "Comp Light" },
      ];
    }

    case "analogous":
      return [-40, -20, 0, 20, 40].map((offset) => ({
        hex: hslToHex((h + offset + 360) % 360, s, l),
        label: offset === 0 ? "Base" : `${offset > 0 ? "+" : ""}${offset}°`,
      }));

    case "triadic":
      return [0, 120, 240].flatMap((offset) => [
        { hex: hslToHex((h + offset) % 360, s, l), label: `${offset}°` },
        { hex: hslToHex((h + offset) % 360, s, Math.min(l + 20, 90)), label: `${offset}° Light` },
      ]);

    case "split-complementary":
      return [0, 150, 210].flatMap((offset) => [
        { hex: hslToHex((h + offset) % 360, s, l), label: `${offset}°` },
        { hex: hslToHex((h + offset) % 360, s, Math.min(l + 20, 90)), label: `${offset}° Light` },
      ]);

    default:
      return [];
  }
}