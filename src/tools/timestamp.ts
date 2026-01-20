export type TimestampUnitMode = "auto" | "s" | "ms";
export type TimezoneMode = "local" | "utc";

export type TimestampParseResult =
  | { ok: true; date: Date; ms: number; assumedUnit?: "s" | "ms" }
  | { ok: false; error: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

export function formatLocal(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const ms = pad3(d.getMilliseconds());
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}.${ms}`;
}

export function formatUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mm = pad2(d.getUTCMinutes());
  const ss = pad2(d.getUTCSeconds());
  const ms = pad3(d.getUTCMilliseconds());
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}.${ms}Z`;
}

export function formatStandard(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function parseLooseDateLike(
  input: string,
  tz: TimezoneMode
): number | undefined {
  const m =
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(
      input
    );
  if (!m) return undefined;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hh = Number(m[4] ?? "0");
  const mm = Number(m[5] ?? "0");
  const ss = Number(m[6] ?? "0");
  const msRaw = m[7] ?? "0";
  const ms =
    msRaw.length === 1
      ? Number(msRaw) * 100
      : msRaw.length === 2
        ? Number(msRaw) * 10
        : Number(msRaw);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hh) ||
    Number.isNaN(mm) ||
    Number.isNaN(ss) ||
    Number.isNaN(ms)
  ) {
    return undefined;
  }

  if (tz === "utc") {
    return Date.UTC(year, month, day, hh, mm, ss, ms);
  }
  return new Date(year, month, day, hh, mm, ss, ms).getTime();
}

function coerceNumericToMs(value: bigint, mode: TimestampUnitMode) {
  if (mode === "s") return { ms: Number(value) * 1000, assumedUnit: "s" as const };
  if (mode === "ms") return { ms: Number(value), assumedUnit: "ms" as const };

  const abs = value < 0n ? -value : value;
  const len = abs.toString().length;
  if (len === 10) return { ms: Number(value) * 1000, assumedUnit: "s" as const };
  if (len === 13) return { ms: Number(value), assumedUnit: "ms" as const };

  if (abs < 100_000_000_000n) return { ms: Number(value) * 1000, assumedUnit: "s" as const };
  return { ms: Number(value), assumedUnit: "ms" as const };
}

export function parseToDate(
  raw: string,
  unitMode: TimestampUnitMode,
  tzForDateText: TimezoneMode
): TimestampParseResult {
  const input = raw.trim();
  if (!input) return { ok: false, error: "请输入时间戳或日期文本" };

  if (/^-?\d+$/.test(input)) {
    try {
      const value = BigInt(input);
      const { ms, assumedUnit } = coerceNumericToMs(value, unitMode);
      if (!Number.isFinite(ms)) return { ok: false, error: "数值过大，无法转换" };
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) return { ok: false, error: "无效时间戳" };
      return { ok: true, date, ms, assumedUnit };
    } catch {
      return { ok: false, error: "无效数字时间戳" };
    }
  }

  const msFromLoose = parseLooseDateLike(input, tzForDateText);
  if (msFromLoose !== undefined) {
    const d = new Date(msFromLoose);
    if (!Number.isNaN(d.getTime())) return { ok: true, date: d, ms: msFromLoose };
  }

  const ms = Date.parse(input);
  if (!Number.isNaN(ms)) {
    const d = new Date(ms);
    return { ok: true, date: d, ms };
  }

  return { ok: false, error: "无法解析：请检查格式或切换解析模式" };
}

