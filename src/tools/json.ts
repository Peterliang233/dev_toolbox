export type JsonResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string; pos?: number; line?: number; col?: number };

export function computeLineCol(text: string, pos: number) {
  let line = 1;
  let col = 1;
  const limit = Math.min(pos, text.length);
  for (let i = 0; i < limit; i++) {
    const ch = text.charCodeAt(i);
    if (ch === 10) {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
}

function extractPos(message: string): number | undefined {
  const m = /position (\d+)/i.exec(message);
  if (!m) return undefined;
  return Number(m[1]);
}

export function jsonParseWithDetails(text: string): JsonResult {
  try {
    const value = JSON.parse(text);
    return { ok: true, value };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const pos = extractPos(msg);
    if (pos === undefined || Number.isNaN(pos)) return { ok: false, error: msg };
    const { line, col } = computeLineCol(text, pos);
    return { ok: false, error: msg, pos, line, col };
  }
}

export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
    const out: Record<string, unknown> = {};
    for (const k of keys) out[k] = sortKeysDeep(obj[k]);
    return out;
  }
  return value;
}

export function jsonFormat(
  text: string,
  indent: number,
  sortKeys: boolean
): JsonResult & { formatted?: string } {
  const parsed = jsonParseWithDetails(text);
  if (!parsed.ok) return parsed;
  const v = sortKeys ? sortKeysDeep(parsed.value) : parsed.value;
  return { ok: true, value: v, formatted: JSON.stringify(v, null, indent) };
}

export function jsonMinify(text: string): JsonResult & { minified?: string } {
  const parsed = jsonParseWithDetails(text);
  if (!parsed.ok) return parsed;
  return { ok: true, value: parsed.value, minified: JSON.stringify(parsed.value) };
}

