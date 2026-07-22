import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GraphChart from "./GraphChart.tsx";
import "./GraphPage.css";

export default function GraphPage() {
    const [graphMode, setGraphMode] = useState("月");
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
          <select className="graph-select-button">
            <option>水温</option>
            <option>塩分濃度</option>
            <option>溶存酸素</option>
          </select>
        </div>

        <section className="graph-range-area">
          <button
              className={`graph-range-button ${
               graphMode === "日" ? "active" : ""
            }`}
            onClick={() => setGraphMode("日")}
            >
              日
          </button>
              
          <button
              className={`graph-range-button ${
                graphMode === "月" ? "active" : ""
              }`}
            onClick={() => setGraphMode("月")}
          >
             月
          </button>

          <button
            className={`graph-range-button ${
              graphMode === "年" ? "active" : ""
            }`}
            onClick={() => setGraphMode("年")}
          >
            年
          </button>

        </section>
      </section>

      <section className="graph-area">
        {/* グラフがここに */}
             <GraphChart /> 

      </section>


    </PageLayout>
  );
}