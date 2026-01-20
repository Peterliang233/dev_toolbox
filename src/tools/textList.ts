export type ParseMode = "auto" | "lines" | "delimiter" | "jsonArray";
export type OutputMode = "lines" | "delimiter" | "quotedDelimiter" | "jsonArray";

export type TextListOptions = {
  parseMode: ParseMode;
  delimiter: string;
  trim: boolean;
  removeEmpty: boolean;
  dedupe: boolean;
};

export function parseItems(input: string, opts: TextListOptions): string[] {
  const raw = input ?? "";

  const fromJsonArray = () => {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("不是 JSON 数组");
    return parsed.map((v) => String(v));
  };

  let items: string[] = [];
  if (opts.parseMode === "jsonArray") {
    items = fromJsonArray();
  } else if (opts.parseMode === "lines") {
    items = raw.split(/\r?\n/);
  } else if (opts.parseMode === "delimiter") {
    items = raw.split(opts.delimiter);
  } else {
    try {
      items = fromJsonArray();
    } catch {
      if (raw.includes("\n")) items = raw.split(/\r?\n/);
      else if (raw.includes(",")) items = raw.split(",");
      else items = raw.split(/\s+/);
    }
  }

  if (opts.trim) items = items.map((s) => s.trim());
  if (opts.removeEmpty) items = items.filter((s) => s.length > 0);
  if (opts.dedupe) {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of items) {
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
    items = out;
  }
  return items;
}

function escapeForQuoted(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function formatItems(items: string[], mode: OutputMode, delimiter: string) {
  if (mode === "lines") return items.join("\n");
  if (mode === "delimiter") return items.join(delimiter);
  if (mode === "quotedDelimiter")
    return items.map((s) => `"${escapeForQuoted(s)}"`).join(delimiter);
  return JSON.stringify(items, null, 2);
}

