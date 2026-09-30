import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GraphChart from "./GraphChart.tsx";
import "./GraphPage.css";

export default function GraphPage() {
  const [graphType, setGraphType] = useState("水温");
  const [graphMode, setGraphMode] = useState("月");
  const unit =
    graphType === "気温" || graphType === "水温"
      ? "℃"
      : graphType === "塩分濃度"
        ? "‰"
        : "mg/L";
  const targetValue =
    graphType === "気温"
      ? null
      : graphType === "水温"
        ? Number(localStorage.getItem("temperature") ?? 10)
        : graphType === "塩分濃度"
          ? Number(localStorage.getItem("salinity") ?? 25)
          : Number(localStorage.getItem("oxygen") ?? 0);
  // const changeMode = (mode: string) => {
  //   setGraphMode(mode);
  //   console.log(mode);
  // };
  return (
    <PageLayout title="グラフ">

      {/* 画面上部のメニュー */}
      <section className="graph-menu">
        {/* データ種類 */}
        <div className="graph-select-area">
          <select className="graph-select-button" value={graphType}
            onChange={(e) => setGraphType(e.target.value)}>
            <option>気温</option>
            <option>水温</option>
            <option>塩分濃度</option>
            <option>溶存酸素</option>
          </select>
        </div>

        <section className="graph-range-area">
          <button
            className={`graph-range-button ${graphMode === "日" ? "active" : ""
              }`}
            onClick={() => setGraphMode("日")}
          >
            日
          </button>

          <button
            className={`graph-range-button ${graphMode === "月" ? "active" : ""
              }`}
            onClick={() => setGraphMode("月")}
          >
            月
          </button>

          <button
            className={`graph-range-button ${graphMode === "年" ? "active" : ""
              }`}
            onClick={() => setGraphMode("年")}
          >
            年
          </button>
        </section>
      </section>

      
      {/* ダミーデータのお知らせ */}
      <div className="graph-notice">
        <div className="graph-notice-text">
          ⚠ こちらのデータはダミーデータです。本物のデータに切り替え次第、お知らせします。  
        </div>
      </div>

      <section className="graph-area">
        {/* グラフがここに */}
        <GraphChart
          graphMode={graphMode}
          unit={unit}
          targetValue={targetValue}
        />
      </section>
    </PageLayout>
  );
}