import { describe, expect, it } from "vitest";
import { jsonFormat, jsonParseWithDetails, jsonMinify } from "./json";

describe("json tools", () => {
  it("validates json and returns ok", () => {
    const r = jsonParseWithDetails('{"a":1,"b":[2,3]}');
    expect(r.ok).toBe(true);
  });

  it("returns line/col for common parse errors", () => {
    const r = jsonParseWithDetails("{\n  a: 1\n}");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(typeof r.line).toBe("number");
    expect(typeof r.col).toBe("number");
  });

  it("formats json with sorted keys", () => {
    const r = jsonFormat('{"b":1,"a":2}', 2, true);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.formatted).toContain('"a": 2');
    expect(r.formatted).toContain('"b": 1');
    expect(r.formatted?.indexOf('"a"')).toBeLessThan(r.formatted?.indexOf('"b"') ?? 0);
  });

  it("minifies json", () => {
    const r = jsonMinify("{\n  \"a\": 1\n}");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.minified).toBe('{"a":1}');
  });
});

