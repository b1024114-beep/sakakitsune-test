import ReactECharts from "echarts-for-react";
import {
  getMonthSeries,
  getYearSeries,
  getDayValue,
  getSensorUnit,
  type CompareSettings,
} from "@/dummyData/compareData";
import "./CompareChart.css";

export default function CompareChart({ settings }: { settings: CompareSettings }) {
  // 比較設定画面で保存された、種類・グラフ期間・期間ごとの日付/色
  const { sensorType, graphPeriod, periods } = settings;
  const unit = getSensorUnit(sensorType);

  // 横軸のラベル一覧と、グラフに描画するseries（グラフ期間ごとに作り方が違う）
  let xData: string[] = [];
  let series: any[];

  if (graphPeriod === "month") {
    // 月選択
    xData = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
    series = periods.map((period) => {
      const map = getMonthSeries(period.year, period.month, sensorType);
      return {
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        connectNulls: false,
        color: period.color,
        itemStyle: { color: period.color },
        data: Array.from({ length: 31 }, (_, i) => map.get(i + 1) ?? null),
      };
    });
  } else if (graphPeriod === "year") {
    // 年選択
    xData = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
    series = periods.map((period) => {
      const map = getYearSeries(period.year, sensorType);
      return {
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        connectNulls: false,
        color: period.color,
        itemStyle: { color: period.color },
        data: Array.from({ length: 12 }, (_, i) => map.get(i + 1) ?? null),
      };
    });
  } else {
    // 日選択：1日1点しかダミーデータが無いので、仮で棒グラフ表示してます
    xData = periods.map((period) => `${period.month}/${period.day}`);
    series = [
      {
        type: "bar",
        // seriesは1本だけ用意し、棒1本ごとにitemStyleで期間の色を指定する
        data: periods.map((period) => ({
          value: getDayValue(period.year, period.month, period.day, sensorType),
          itemStyle: { color: period.color },
        })),
      },
    ];
  }

  // 横軸の単位ラベル（月モードは「日」、年モードは「月」、日モードは棒に日付が出るので無し）
  const xUnit = graphPeriod === "month" ? "日" : graphPeriod === "year" ? "月" : "";

  // EChartsに渡すグラフ設定
  const option = {

    // グラフ本体まわりの余白
    grid: {
      left: 35,
      right: 20,
      top: 35,
      bottom: 70,
    },

    // 横軸（期間ごとの日付/月を表示）
    xAxis: {
      type: "category",
      data: xData,
      name: xUnit ? `[${xUnit}]` : undefined,
      nameLocation: "end",
      nameGap: 15,
    },

    // 縦軸（種類ごとの単位を表示）
    yAxis: {
      type: "value",
      name: `[${unit}]`,
      nameLocation: "end",
      nameGap: 15,
    },

    series,
  };

  return (
    <div className="compare-chart">
      <ReactECharts option={option} notMerge={true} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
