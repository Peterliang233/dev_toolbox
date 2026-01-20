import React, { useEffect, useMemo, useState } from "react";
import { storageGet, storageSet } from "../shared/storage";
import TimestampTool from "./tools/TimestampTool";
import JsonTool from "./tools/JsonTool";
import TextListTool from "./tools/TextListTool";
import EscapeTool from "./tools/EscapeTool";

type TabKey = "timestamp" | "json" | "text" | "escape";

const TAB_STORAGE_KEY = "ui:activeTab";

export default function App() {
  const [tab, setTab] = useState<TabKey>("timestamp");

  useEffect(() => {
    storageGet<TabKey>("sync", TAB_STORAGE_KEY).then((saved) => {
      if (saved === "timestamp" || saved === "json" || saved === "text" || saved === "escape") setTab(saved);
    });
  }, []);

  useEffect(() => {
    storageSet("sync", TAB_STORAGE_KEY, tab);
  }, [tab]);

  const content = useMemo(() => {
    if (tab === "timestamp") return <TimestampTool />;
    if (tab === "json") return <JsonTool />;
    if (tab === "escape") return <EscapeTool />;
    return <TextListTool />;
  }, [tab]);

  return (
    <div className="app">
      <div className="header">
        <p className="title">Dev Toolbox</p>
        <div className="tabs" role="tablist" aria-label="工具切换">
          <button
            className="tab"
            role="tab"
            aria-selected={tab === "timestamp"}
            onClick={() => setTab("timestamp")}
          >
            时间戳
          </button>
          <button
            className="tab"
            role="tab"
            aria-selected={tab === "json"}
            onClick={() => setTab("json")}
          >
            JSON
          </button>
          <button
            className="tab"
            role="tab"
            aria-selected={tab === "text"}
            onClick={() => setTab("text")}
          >
            文本/列表
          </button>
          <button
            className="tab"
            role="tab"
            aria-selected={tab === "escape"}
            onClick={() => setTab("escape")}
          >
            转义
          </button>
        </div>
      </div>
      {content}
    </div>
  );
}

