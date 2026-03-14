import type { LucideIcon } from "lucide-react";
import {
  Code2, Database, ArrowLeftRight, Palette,
  Globe, Type, Lock, MoreHorizontal, Briefcase,
} from "lucide-react";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "code":           Code2,
  "data-format":    Database,
  "converter":      ArrowLeftRight,
  "design":         Palette,
  "web":            Globe,
  "text":           Type,
  "encode-decode":  Lock,
  "jobs":           Briefcase,
  "etc":            MoreHorizontal,
};