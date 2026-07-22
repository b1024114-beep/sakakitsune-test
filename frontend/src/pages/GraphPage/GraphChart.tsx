import ReactECharts from "echarts-for-react";
import "./GraphChart.css";

export default function GraphChart() {

  // ダミーデータ100日分を作成
  const graphData = Array.from({ length: 100 }, (_, i) => ({
    day: i + 1,
    value: 20 + Math.sin(i / 5) * 2 + Math.random() * 0.5,
  }));

 // EChartsの設定
  const option = {
    xAxis: {
      type: "category",
      data: graphData.map((d) => d.day),
    },

    yAxis: {
      type: "value",
    },

    series: [
      {
        type: "line",
        smooth: true,
        data: graphData.map((d) => d.value),
      },
    ],

    // ★ここを追加
  dataZoom: [
    {
      type: "inside",
      xAxisIndex: 0,
      start: 0,
      end: 15,
      zoomLock: true,
      moveOnMouseMove: true,
      moveOnMouseWheel: false,
    },
  ],
  };

  return (
    <div className="graph-chart">
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}