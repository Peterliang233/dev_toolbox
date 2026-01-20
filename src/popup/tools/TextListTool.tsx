import React, { useEffect, useMemo, useState } from "react";
import { copyText } from "../../shared/clipboard";
import { storageGet, storageSet } from "../../shared/storage";
import { formatItems, OutputMode, parseItems, ParseMode, TextListOptions } from "../../tools/textList";

const PREF_KEY = "textList:prefs";
const DRAFT_KEY = "textList:draft";

const DEFAULT_PREFS: TextListOptions = {
  parseMode: "auto",
  delimiter: ",",
  trim: true,
  removeEmpty: true,
  dedupe: false
};

export default function TextListTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputMode, setOutputMode] = useState<OutputMode>("jsonArray");
  const [prefs, setPrefs] = useState<TextListOptions>(DEFAULT_PREFS);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    storageGet<string>("local", DRAFT_KEY).then((v) => {
      if (typeof v === "string") setInput(v);
    });
    storageGet<TextListOptions>("sync", PREF_KEY).then((v) => {
      if (v && typeof v === "object") {
        const vv = v as Partial<TextListOptions>;
        setPrefs({
          parseMode: vv.parseMode ?? DEFAULT_PREFS.parseMode,
          delimiter: vv.delimiter ?? DEFAULT_PREFS.delimiter,
          trim: vv.trim ?? DEFAULT_PREFS.trim,
          removeEmpty: vv.removeEmpty ?? DEFAULT_PREFS.removeEmpty,
          dedupe: vv.dedupe ?? DEFAULT_PREFS.dedupe
        });
      }
    });
  }, []);

  useEffect(() => {
    storageSet("local", DRAFT_KEY, input);
  }, [input]);

  useEffect(() => {
    storageSet("sync", PREF_KEY, prefs);
  }, [prefs]);

  const itemsPreview = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const items = parseItems(input, prefs);
      return { count: items.length };
    } catch {
      return null;
    }
  }, [input, prefs]);

  function normalizeDelimiter(d: string) {
    if (d === "\\n") return "\n";
    if (d === "\\t") return "\t";
    return d;
  }

  function onConvert() {
    try {
      const items = parseItems(input, { ...prefs, delimiter: normalizeDelimiter(prefs.delimiter) });
      const out = formatItems(items, outputMode, normalizeDelimiter(prefs.delimiter));
      setOutput(out);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  }

  async function onCopy() {
    if (!output) return;
    const ok = await copyText(output);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 700);
  }

  return (
    <div className="content" style={{ flex: 1, minHeight: 0 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <span className="label">解析</span>
          <select
            className="select"
            value={prefs.parseMode}
            onChange={(e) => setPrefs((p) => ({ ...p, parseMode: e.target.value as ParseMode }))}
          >
            <option value="auto">自动</option>
            <option value="lines">按行</option>
            <option value="delimiter">按分隔符</option>
            <option value="jsonArray">JSON 数组</option>
          </select>

          <span className="label">分隔符</span>
          <input
            className="input"
            style={{ width: 60 }}
            value={prefs.delimiter}
            onChange={(e) => setPrefs((p) => ({ ...p, delimiter: e.target.value }))}
            placeholder=", 或 \\n"
          />

          <span className="label">输出</span>
          <select className="select" value={outputMode} onChange={(e) => setOutputMode(e.target.value as OutputMode)}>
            <option value="jsonArray">JSON 数组</option>
            <option value="lines">多行文本</option>
            <option value="delimiter">分隔符串</option>
            <option value="quotedDelimiter">带引号分隔</option>
          </select>

          <div className="divider-v" />

          <button className="btn primary" onClick={onConvert}>
            转换
          </button>
          <button className="btn danger" onClick={() => { setInput(""); setOutput(""); setError(null); }}>
            清空
          </button>
        </div>

        <div className="row">
          {itemsPreview ? <span className="hint" style={{ marginRight: 12 }}>条目数：{itemsPreview.count}</span> : null}
          <button className="btn" onClick={onCopy} disabled={!output}>
            {copied ? "已复制" : "复制结果"}
          </button>
        </div>
      </div>

      <div className="row">
        <label className="row" style={{ gap: 6 }}>
          <input type="checkbox" checked={prefs.trim} onChange={(e) => setPrefs((p) => ({ ...p, trim: e.target.checked }))} />
          <span className="label">trim</span>
        </label>
        <label className="row" style={{ gap: 6 }}>
          <input
            type="checkbox"
            checked={prefs.removeEmpty}
            onChange={(e) => setPrefs((p) => ({ ...p, removeEmpty: e.target.checked }))}
          />
          <span className="label">去空</span>
        </label>
        <label className="row" style={{ gap: 6 }}>
          <input type="checkbox" checked={prefs.dedupe} onChange={(e) => setPrefs((p) => ({ ...p, dedupe: e.target.checked }))} />
          <span className="label">去重</span>
        </label>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="split-workspace">
        <div className="editor-wrapper">
          <div className="label">输入</div>
          <textarea
            className="textarea editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'输入：\n- 多行文本\n- a,b,c\n- ["a","b"]'}
            spellCheck={false}
          />
        </div>

        <div className="editor-wrapper">
          <div className="label">输出</div>
          <textarea
            className="textarea editor"
            value={output}
            readOnly
            placeholder="转换结果会出现在这里"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

