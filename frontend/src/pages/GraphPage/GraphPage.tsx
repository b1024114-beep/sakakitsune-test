import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GraphChart from "./GraphChart";
import "./GraphPage.css";

// データ種類ごとの単位と目標値
const GRAPH_TYPES: Record<string, { unit: string; target: { key: string; default: number } | null }> = {
  気温:     { unit: "℃",    target: null },
  水温:     { unit: "℃",    target: { key: "temperature", default: 20 } },
  塩分濃度: { unit: "‰",    target: { key: "salinity",    default: 30 } },
  溶存酸素: { unit: "mg/L", target: { key: "oxygen",      default: 3.5 } },
};

const GRAPH_MODES = ["日", "月", "年"];

export default function GraphPage() {
  const [graphType, setGraphType] = useState("水温");
  const [graphMode, setGraphMode] = useState("月");

  const { unit, target } = GRAPH_TYPES[graphType];
  const targetValue = target ? Number(localStorage.getItem(target.key) ?? target.default) : null;

  return (
    <PageLayout title="グラフ">
      {/* 画面上部のメニュー */}
      <section className="graph-menu">
        {/* データ種類 */}
        <div className="graph-select-area">
          <select
            className="graph-select-button"
            value={graphType}
            onChange={(e) => setGraphType(e.target.value)}
          >
            {Object.keys(GRAPH_TYPES).map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* 表示期間 */}
        <div className="graph-range-area">
          {GRAPH_MODES.map((mode) => (
            <button
              key={mode}
              className={`graph-range-button ${graphMode === mode ? "active" : ""}`}
              onClick={() => setGraphMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      <section className="graph-area">
        <GraphChart graphType={graphType} graphMode={graphMode} unit={unit} targetValue={targetValue} />
      </section>
    </PageLayout>
  );
}