import { describe, expect, it } from "vitest";
import { parseToDate } from "./timestamp";

describe("timestamp", () => {
  it("parses 10-digit timestamp as seconds in auto mode", () => {
    const r = parseToDate("1700000000", "auto", "local");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.assumedUnit).toBe("s");
    expect(r.ms).toBe(1700000000 * 1000);
  });

  it("parses 13-digit timestamp as milliseconds in auto mode", () => {
    const r = parseToDate("1700000000000", "auto", "local");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.assumedUnit).toBe("ms");
    expect(r.ms).toBe(1700000000000);
  });

  it("parses loose date text as UTC when tzForDateText=utc", () => {
    const r = parseToDate("2026-01-19 12:34:56.789", "auto", "utc");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.date.getUTCFullYear()).toBe(2026);
    expect(r.date.getUTCMonth()).toBe(0);
    expect(r.date.getUTCDate()).toBe(19);
    expect(r.date.getUTCHours()).toBe(12);
    expect(r.date.getUTCMinutes()).toBe(34);
    expect(r.date.getUTCSeconds()).toBe(56);
    expect(r.date.getUTCMilliseconds()).toBe(789);
  });
});

