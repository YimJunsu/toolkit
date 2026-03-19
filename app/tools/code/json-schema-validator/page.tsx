"use client";

import { useState, useCallback } from "react";
import { ListChecks, Copy, Check, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

interface SchemaObject {
  type?: string | string[];
  required?: string[];
  properties?: Record<string, SchemaObject>;
  additionalProperties?: boolean | SchemaObject;
  items?: SchemaObject;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  [key: string]: unknown;
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function validateSchema(data: unknown, schema: SchemaObject, path = ""): string[] {
  const errors: string[] = [];
  const at = path || "(root)";

  // type check
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = getType(data);
    const typeMatch = types.some((t) => {
      if (t === "integer") return typeof data === "number" && Number.isInteger(data);
      return t === actualType;
    });
    if (!typeMatch) {
      errors.push(`${at}: 타입이 "${types.join(" | ")}"이어야 하지만 "${actualType}"입니다`);
      return errors;
    }
  }

  // enum
  if (schema.enum !== undefined) {
    const match = schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(data));
    if (!match) {
      errors.push(`${at}: 허용된 값(${schema.enum.map((e) => JSON.stringify(e)).join(", ")}) 중 하나여야 합니다`);
    }
  }

  // string checks
  if (typeof data === "string") {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push(`${at}: 최소 ${schema.minLength}자 이상이어야 합니다 (현재 ${data.length}자)`);
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push(`${at}: 최대 ${schema.maxLength}자 이하여야 합니다 (현재 ${data.length}자)`);
    }
    if (schema.pattern !== undefined) {
      try {
        if (!new RegExp(schema.pattern).test(data)) {
          errors.push(`${at}: 패턴 "${schema.pattern}"과 일치하지 않습니다`);
        }
      } catch {
        errors.push(`${at}: 잘못된 정규식 패턴입니다`);
      }
    }
  }

  // number checks
  if (typeof data === "number") {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push(`${at}: ${schema.minimum} 이상이어야 합니다 (현재 ${data})`);
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push(`${at}: ${schema.maximum} 이하여야 합니다 (현재 ${data})`);
    }
  }

  // object checks
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const dataObj = data as Record<string, unknown>;

    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in dataObj)) {
          errors.push(`${at}: 필수 속성 "${key}"이 없습니다`);
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in dataObj) {
          errors.push(...validateSchema(dataObj[key], propSchema, `${at}.${key}`));
        }
      }
    }

    if (schema.additionalProperties === false && schema.properties) {
      const allowed = new Set(Object.keys(schema.properties));
      for (const key of Object.keys(dataObj)) {
        if (!allowed.has(key)) {
          errors.push(`${at}: 추가 속성 "${key}"은 허용되지 않습니다`);
        }
      }
    } else if (
      typeof schema.additionalProperties === "object" &&
      schema.additionalProperties !== null &&
      schema.properties
    ) {
      const allowed = new Set(Object.keys(schema.properties));
      for (const [key, val] of Object.entries(dataObj)) {
        if (!allowed.has(key)) {
          errors.push(...validateSchema(val, schema.additionalProperties as SchemaObject, `${at}.${key}`));
        }
      }
    }
  }

  // array checks
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(`${at}: 최소 ${schema.minItems}개 이상의 항목이 필요합니다 (현재 ${data.length}개)`);
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push(`${at}: 최대 ${schema.maxItems}개 이하여야 합니다 (현재 ${data.length}개)`);
    }
    if (schema.items) {
      data.forEach((item, i) => {
        errors.push(...validateSchema(item, schema.items!, `${at}[${i}]`));
      });
    }
  }

  return errors;
}

const SAMPLE_JSON = `{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com",
  "tags": ["developer", "designer"]
}`;

const SAMPLE_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "age", "email"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "email": {
      "type": "string",
      "pattern": "^[^@]+@[^@]+\\\\.[^@]+$"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "maxItems": 10
    }
  },
  "additionalProperties": false
}`;

export default function JsonSchemaValidatorPage() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [schemaInput, setSchemaInput] = useState(SAMPLE_SCHEMA);
  const [result, setResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const { copied, copy } = useClipboard();

  const handleValidate = useCallback(() => {
    let data: unknown;
    let schema: SchemaObject;

    try {
      data = JSON.parse(jsonInput);
    } catch (e) {
      setResult({ valid: false, errors: [`JSON 파싱 오류: ${e instanceof Error ? e.message : String(e)}`] });
      return;
    }

    try {
      schema = JSON.parse(schemaInput) as SchemaObject;
    } catch (e) {
      setResult({ valid: false, errors: [`스키마 파싱 오류: ${e instanceof Error ? e.message : String(e)}`] });
      return;
    }

    const errors = validateSchema(data, schema);
    setResult({ valid: errors.length === 0, errors });
  }, [jsonInput, schemaInput]);

  const handleExample = () => {
    setJsonInput(SAMPLE_JSON);
    setSchemaInput(SAMPLE_SCHEMA);
    setResult(null);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="JSON Schema Validator"
      description="JSON 데이터를 JSON Schema Draft-7 규칙에 따라 검증합니다. 타입, 필수 필드, 패턴 등을 검사합니다."
      icon={ListChecks}
    >
      <div className="flex flex-col gap-6">
        {/* 액션 버튼 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleValidate}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            검증하기
          </button>
          <button
            type="button"
            onClick={handleExample}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
          >
            예시 불러오기
          </button>
          {result && (
            <span
              className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                result.valid
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                  : "border-red-500/40 bg-red-500/10 text-red-400"
              }`}
            >
              {result.valid ? (
                <><CheckCircle2 size={12} /> 유효한 JSON</>
              ) : (
                <><AlertTriangle size={12} /> {result.errors.length}개 오류</>
              )}
            </span>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* JSON 입력 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">JSON 데이터</span>
              <button
                type="button"
                onClick={() => setJsonInput("")}
                className="text-xs text-text-secondary transition-colors hover:text-text-primary"
              >
                지우기
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"key": "value"}'
              rows={18}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 transition-colors focus:border-brand focus:outline-none"
            />
          </div>

          {/* 스키마 입력 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">JSON Schema</span>
              <button
                type="button"
                onClick={() => setSchemaInput("")}
                className="text-xs text-text-secondary transition-colors hover:text-text-primary"
              >
                지우기
              </button>
            </div>
            <textarea
              value={schemaInput}
              onChange={(e) => setSchemaInput(e.target.value)}
              placeholder='{"type": "object"}'
              rows={18}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary placeholder-text-secondary/50 transition-colors focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {/* 검증 결과 */}
        {result && (
          <div
            className={`rounded-xl border p-5 ${
              result.valid
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}
          >
            {result.valid ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <span className="font-semibold text-emerald-500">검증 통과 — 모든 스키마 규칙을 만족합니다.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-400" />
                    <span className="font-semibold text-red-400">검증 실패 — {result.errors.length}개의 오류가 발견되었습니다</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(result.errors.join("\n"), "errors")}
                    className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-red-400/50 hover:text-red-400"
                  >
                    {copied === "errors" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    복사
                  </button>
                </div>
                <ul className="flex flex-col gap-2">
                  {result.errors.map((err, i) => {
                    const colonIdx = err.indexOf(":");
                    const path = colonIdx !== -1 ? err.slice(0, colonIdx) : "";
                    const msg = colonIdx !== -1 ? err.slice(colonIdx + 1).trim() : err;
                    return (
                      <li key={i} className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                        <span className="mt-0.5 shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-xs text-red-400">
                          {path}
                        </span>
                        <span className="text-sm text-text-primary">{msg}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 지원 키워드 안내 */}
        <div className="rounded-xl border border-border bg-bg-secondary p-4">
          <p className="mb-2 text-xs font-semibold text-text-secondary">지원 키워드 (Draft-7 부분 구현)</p>
          <div className="flex flex-wrap gap-2">
            {["type","required","properties","additionalProperties","items","minLength","maxLength","minimum","maximum","enum","pattern","minItems","maxItems"].map((kw) => (
              <span key={kw} className="rounded border border-border bg-bg-primary px-2 py-0.5 font-mono text-xs text-text-secondary">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
