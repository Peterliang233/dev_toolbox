import React, { useEffect, useState } from "react";
import { copyText } from "../../shared/clipboard";
import { storageGet, storageSet } from "../../shared/storage";
import { DEFAULT_ESCAPE_OPTIONS, doEscape, doUnescape, EscapeOptions } from "../../tools/escape";

const PREF_KEY = "escape:prefs";
const DRAFT_KEY = "escape:draft";

export default function EscapeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [prefs, setPrefs] = useState<EscapeOptions>(DEFAULT_ESCAPE_OPTIONS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    storageGet<string>("local", DRAFT_KEY).then((v) => {
      if (typeof v === "string") setInput(v);
    });
    storageGet<EscapeOptions>("sync", PREF_KEY).then((v) => {
      if (v && typeof v === "object") {
        setPrefs({ ...DEFAULT_ESCAPE_OPTIONS, ...v });
      }
    });
  }, []);

  useEffect(() => {
    storageSet("local", DRAFT_KEY, input);
  }, [input]);

  useEffect(() => {
    storageSet("sync", PREF_KEY, prefs);
  }, [prefs]);

  async function onCopy() {
    if (!output) return;
    const ok = await copyText(output);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 700);
  }

  function handleEscape() {
    setOutput(doEscape(input, prefs));
  }

  function handleUnescape() {
    setOutput(doUnescape(input));
  }

  function clearAll() {
    setInput("");
    setOutput("");
  }

  return (
    <div className="content" style={{ flex: 1, minHeight: 0 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <button className="btn primary" onClick={handleEscape}>
            转义
          </button>
          <button className="btn" onClick={handleUnescape}>
            去转义
          </button>
          <button className="btn danger" onClick={clearAll}>
            清空
          </button>

          <div className="divider-v" />

          <label className="row" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={prefs.escapeNewlines}
              onChange={(e) => setPrefs((p) => ({ ...p, escapeNewlines: e.target.checked }))}
            />
            <span className="label">\n \r</span>
          </label>
          <label className="row" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={prefs.escapeTabs}
              onChange={(e) => setPrefs((p) => ({ ...p, escapeTabs: e.target.checked }))}
            />
            <span className="label">\t</span>
          </label>
          <label className="row" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={prefs.escapeDoubleQuotes}
              onChange={(e) => setPrefs((p) => ({ ...p, escapeDoubleQuotes: e.target.checked }))}
            />
            <span className="label">"</span>
          </label>
          <label className="row" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={prefs.escapeSingleQuotes}
              onChange={(e) => setPrefs((p) => ({ ...p, escapeSingleQuotes: e.target.checked }))}
            />
            <span className="label">'</span>
          </label>
        </div>

        <div className="row">
          <button className="btn" onClick={onCopy} disabled={!output}>
            {copied ? "已复制" : "复制结果"}
          </button>
        </div>
      </div>

      <div className="split-workspace">
        <div className="editor-wrapper">
          <div className="label">输入</div>
          <textarea
            className="textarea editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此输入需要处理的文本..."
            spellCheck={false}
          />
        </div>

        <div className="editor-wrapper">
          <div className="label">输出</div>
          <textarea
            className="textarea editor"
            value={output}
            readOnly
            placeholder="结果显示区域"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
