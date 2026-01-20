import React, { useEffect, useMemo, useState } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import { copyText } from "../../shared/clipboard";
import { storageGet, storageSet } from "../../shared/storage";
import { jsonFormat, jsonMinify, jsonParseWithDetails } from "../../tools/json";

const PREF_INDENT_KEY = "json:indent";
const PREF_SORT_KEY = "json:sortKeys";
const DRAFT_KEY = "json:draft";

export default function JsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [jsonObj, setJsonObj] = useState<unknown>(null);
  const [viewMode, setViewMode] = useState<"text" | "tree">("text");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Detect dark mode
  const [isDark, setIsDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const q = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    q.addEventListener("change", handler);
    return () => q.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    storageGet<string>("local", DRAFT_KEY).then((v) => {
      if (typeof v === "string") setInput(v);
    });
    storageGet<number>("sync", PREF_INDENT_KEY).then((v) => {
      if (v === 2 || v === 4) setIndent(v);
    });
    storageGet<boolean>("sync", PREF_SORT_KEY).then((v) => {
      if (typeof v === "boolean") setSortKeys(v);
    });
  }, []);

  useEffect(() => {
    storageSet("local", DRAFT_KEY, input);
  }, [input]);

  useEffect(() => {
    storageSet("sync", PREF_INDENT_KEY, indent);
  }, [indent]);

  useEffect(() => {
    storageSet("sync", PREF_SORT_KEY, sortKeys);
  }, [sortKeys]);

  const status = useMemo(() => {
    if (!input.trim()) return null;
    const r = jsonParseWithDetails(input);
    if (r.ok) return { ok: true as const, text: "JSON 合法" };
    if (r.line && r.col) return { ok: false as const, text: `错误：第 ${r.line} 行，第 ${r.col} 列` };
    return { ok: false as const, text: "JSON 非法" };
  }, [input]);

  async function onCopy() {
    if (!output) return;
    const ok = await copyText(output);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 700);
  }

  function applyFormat() {
    const r = jsonFormat(input, indent, sortKeys);
    if (!r.ok) {
      setError(r.line && r.col ? `${r.error}（第 ${r.line} 行，第 ${r.col} 列）` : r.error);
      return;
    }
    setError(null);
    setJsonObj(r.value);
    setOutput(r.formatted ?? "");
    setViewMode("tree");
  }

  function applyMinify() {
    const r = jsonMinify(input);
    if (!r.ok) {
      setError(r.line && r.col ? `${r.error}（第 ${r.line} 行，第 ${r.col} 列）` : r.error);
      return;
    }
    setError(null);
    setOutput(r.minified ?? "");
    setViewMode("text");
  }

  function applyValidate() {
    const r = jsonParseWithDetails(input);
    if (r.ok) {
      setError(null);
      setOutput("");
      setViewMode("text"); // 校验通过后，不一定需要显示树，但也可以显示。这里暂不强制切换，或者保持当前状态。
      // 但为了清空之前的输出（如果有错误），上面已经 setOutput("") 了。
      return;
    }
    setError(r.line && r.col ? `${r.error}（第 ${r.line} 行，第 ${r.col} 列）` : r.error);
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setJsonObj(null);
    setError(null);
    setViewMode("text");
  }

  return (
    <div className="content" style={{ flex: 1, minHeight: 0 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <span className="label">缩进</span>
          <select className="select" value={indent} onChange={(e) => setIndent(Number(e.target.value) as 2 | 4)}>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>

          <label className="row" style={{ gap: 6 }}>
            <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} />
            <span className="label">排序 key</span>
          </label>

          <div className="divider-v" />

          <button className="btn primary" onClick={applyFormat}>
            格式化
          </button>
          <button className="btn" onClick={applyMinify}>
            压缩
          </button>
          <button className="btn" onClick={applyValidate}>
            校验
          </button>
          <button className="btn danger" onClick={clearAll}>
            清空
          </button>
        </div>

        <div className="row">
           {status ? <span className={status.ok ? "hint" : "error"} style={{ marginRight: 12 }}>{status.text}</span> : null}
           <button className="btn" onClick={onCopy} disabled={!output}>
            {copied ? "已复制" : "复制结果"}
          </button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="split-workspace">
        <div className="editor-wrapper">
          <div className="label">输入</div>
          <textarea
            className="textarea editor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='粘贴 JSON，例如：{"a":1,"b":[2,3]}'
            spellCheck={false}
          />
        </div>

        <div className="editor-wrapper">
          <div className="label">输出</div>
          {viewMode === "tree" && jsonObj !== null ? (
            <div className="textarea editor" style={{ overflow: "auto", padding: 10 }}>
              <JsonView
                src={jsonObj}
                theme={isDark ? "vscode" : "default"}
                enableClipboard={true}
                displaySize={true}
                collapsed={false}
                editable={false}
              />
            </div>
          ) : (
            <textarea
              className="textarea editor"
              value={output}
              readOnly
              placeholder="这里会显示格式化/压缩后的结果"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

