export interface Category {
  id: string;
  label: string;
  href: string;
}

export const CATEGORIES: Category[] = [
  { id: "code",           label: "코드",            href: "/tools/code" },
  { id: "data-format",    label: "Data / Format",   href: "/tools/data-format" },
  { id: "converter",      label: "Converter",        href: "/tools/converter" },
  { id: "design",         label: "Design",           href: "/tools/design" },
  { id: "web",            label: "Web",              href: "/tools/web" },
  { id: "text",           label: "Text",             href: "/tools/text" },
  { id: "encode-decode",  label: "Encode / Decode",  href: "/tools/encode-decode" },
  { id: "jobs",           label: "Jobs",             href: "/tools/jobs" },
  { id: "etc",            label: "기타",              href: "/tools/etc" },
];