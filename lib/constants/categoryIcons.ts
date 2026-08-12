import type { LucideIcon } from "lucide-react";
import { Code2, Palette, Calculator, Wrench, Sparkles } from "lucide-react";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "code":    Code2,
  "design":  Palette,
  "jobs":    Calculator,
  "utility": Wrench,
  "fun":     Sparkles,
};