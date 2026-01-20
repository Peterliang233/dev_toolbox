import React, { useEffect, useMemo, useState } from "react";
import { copyText } from "../../shared/clipboard";
import { storageGet, storageSet } from "../../shared/storage";
import {
  formatLocal,
  formatStandard,
  formatUTC,
  parseToDate,
  TimestampUnitMode,
  TimezoneMode
} from "../../tools/timestamp";

const PREF_UNIT_KEY = "timestamp:unitMode";
const PREF_TZ_KEY = "timestamp:timezone";
const DRAFT_KEY = "timestamp:draft";

export default function TimestampTool() {
  const [input, setInput] = useState("");
  const [unitMode, setUnitMode] = useState<TimestampUnitMode>("auto");
  const [tz, setTz] = useState<TimezoneMode>("local");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    storageGet<string>("local", DRAFT_KEY).then((v) => {
      if (typeof v === "string") setInput(v);
    });
    storageGet<TimestampUnitMode>("sync", PREF_UNIT_KEY).then((v) => {
      if (v === "auto" || v === "s" || v === "ms") setUnitMode(v);
    });
    storageGet<TimezoneMode>("sync", PREF_TZ_KEY).then((v) => {
      if (v === "local" || v === "utc") setTz(v);
    });
  }, []);

  useEffect(() => {
    storageSet("local", DRAFT_KEY, input);
  }, [input]);

  useEffect(() => {
    storageSet("sync", PREF_UNIT_KEY, unitMode);
  }, [unitMode]);

  useEffect(() => {
    storageSet("sync", PREF_TZ_KEY, tz);
  }, [tz]);

  const parsed = useMemo(() => parseToDate(input, unitMode, tz), [input, unitMode, tz]);
  const outputs = useMemo(() => {
    if (!parsed.ok) return null;
    const d = parsed.date;
    const ms = parsed.ms;
    const s = Math.trunc(ms / 1000);
    return {
      local: formatLocal(d),
      standard: formatStandard(d),
      utc: formatUTC(d),
      ms: String(ms),
      s: String(s),
      iso: d.toISOString()
    };
  }, [parsed]);

  async function onCopy(key: string, value: string) {
    const ok = await copyText(value);
    setCopiedKey(ok ? key : null);
    window.setTimeout(() => setCopiedKey(null), 700);
  }

  function setNowMs() {
    setInput(String(Date.now()));
    setUnitMode("ms");
  }

  return (
    <div className="content">
      <div className="row">
        <span className="label">输入</span>
        <input
          className="input"
          style={{ flex: 1, minWidth: 200 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="时间戳（秒/毫秒）或日期（2026-01-19 12:34:56）"
        />
        <button className="btn primary" onClick={setNowMs}>
          现在
        </button>
        <button className="btn" onClick={() => setInput("")}>
          清空
        </button>
      </div>

      <div className="row">
        <span className="label">时间戳单位</span>
        <select
          className="select"
          value={unitMode}
          onChange={(e) => setUnitMode(e.target.value as TimestampUnitMode)}
        >
          <option value="auto">自动</option>
          <option value="s">秒</option>
          <option value="ms">毫秒</option>
        </select>

        <span className="label">日期解析/输出</span>
        <select
          className="select"
          value={tz}
          onChange={(e) => setTz(e.target.value as TimezoneMode)}
        >
          <option value="local">本地</option>
          <option value="utc">UTC</option>
        </select>

        {parsed.ok && parsed.assumedUnit ? (
          <span className="hint">自动识别为：{parsed.assumedUnit === "s" ? "秒" : "毫秒"}</span>
        ) : null}
      </div>

      {!parsed.ok ? (
        <div className="card">
          <div className="error">{parsed.error}</div>
          <div className="hint">提示：纯数字会按“时间戳单位”解析；日期可切换“本地/UTC”。</div>
        </div>
      ) : (
        <div className="grid-2">
          {outputs ? (
            <>
              <div className="card">
                <div className="kv">
                  <div className="k">本地时间</div>
                  <button
                    className="btn"
                    onClick={() => onCopy("local", outputs.local)}
                    title="复制"
                  >
                    {copiedKey === "local" ? "已复制" : "复制"}
                  </button>
                </div>
                <div className="v" style={{ marginTop: 8 }}>
                  {outputs.local}
                </div>
              </div>

              <div className="card">
                <div className="kv">
                  <div className="k">本地时间 (无毫秒)</div>
                  <button
                    className="btn"
                    onClick={() => onCopy("standard", outputs.standard)}
                    title="复制"
                  >
                    {copiedKey === "standard" ? "已复制" : "复制"}
                  </button>
                </div>
                <div className="v" style={{ marginTop: 8 }}>
                  {outputs.standard}
                </div>
              </div>

              <div className="card">
                <div className="kv">
                  <div className="k">UTC 时间</div>
                  <button className="btn" onClick={() => onCopy("utc", outputs.utc)} title="复制">
                    {copiedKey === "utc" ? "已复制" : "复制"}
                  </button>
                </div>
                <div className="v" style={{ marginTop: 8 }}>
                  {outputs.utc}
                </div>
              </div>

              <div className="card">
                <div className="kv">
                  <div className="k">毫秒时间戳</div>
                  <button className="btn" onClick={() => onCopy("ms", outputs.ms)} title="复制">
                    {copiedKey === "ms" ? "已复制" : "复制"}
                  </button>
                </div>
                <div className="v" style={{ marginTop: 8 }}>
                  {outputs.ms}
                </div>
              </div>

              <div className="card">
                <div className="kv">
                  <div className="k">秒时间戳</div>
                  <button className="btn" onClick={() => onCopy("s", outputs.s)} title="复制">
                    {copiedKey === "s" ? "已复制" : "复制"}
                  </button>
                </div>
                <div className="v" style={{ marginTop: 8 }}>
                  {outputs.s}
                </div>
              </div>

              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <div className="kv">
                  <div className="k">ISO8601</div>
                  <button className="btn" onClick={() => onCopy("iso", outputs.iso)} title="复制">
                    {copiedKey === "iso" ? "已复制" : "复制"}
                  </button>
                </div>
                <div className="v" style={{ marginTop: 8 }}>
                  {outputs.iso}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

