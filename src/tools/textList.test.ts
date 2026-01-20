import { describe, expect, it } from "vitest";
import { formatItems, parseItems } from "./textList";

describe("textList", () => {
  it("parses json array in auto mode", () => {
    const items = parseItems('["a","b"]', {
      parseMode: "auto",
      delimiter: ",",
      trim: true,
      removeEmpty: true,
      dedupe: false
    });
    expect(items).toEqual(["a", "b"]);
  });

  it("parses delimiter mode and applies trim/removeEmpty/dedupe", () => {
    const items = parseItems(" a, ,b, a ", {
      parseMode: "delimiter",
      delimiter: ",",
      trim: true,
      removeEmpty: true,
      dedupe: true
    });
    expect(items).toEqual(["a", "b"]);
  });

  it("formats quoted delimiter with escaping", () => {
    const out = formatItems(['a"b', "c\\d"], "quotedDelimiter", ",");
    expect(out).toBe('"a\\"b","c\\\\d"');
  });
});

