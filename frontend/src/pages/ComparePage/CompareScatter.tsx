import ReactECharts from "echarts-for-react";
import juneData from "@/dummyData/june.json";
import julyData from "@/dummyData/july.json";
import "./CompareScatter.css"

type CompareScatterProps = {
  settings: any;
};

export default function CompareScatter({
  settings,
}: CompareScatterProps) {

  // ダミーデータ
  const dummyData = [
    ...juneData.data,
    ...julyData.data,
  ];

  // 相関図の種類の優先順位
  const sensorPriority = [
    "air",
    "water",
    "salt",
    "oxygen",
  ];

  // 相関図の軸を決定
  const getCorrelationAxes = () => {

    if (!settings?.correlationMode) {
      return null;
    }

    const sensors = settings.correlationSensors;

    if (!sensors || sensors.length !== 2) {
      return null;
    }

    // 優先順位の高い順に並べる
    const sortedSensors = [...sensors].sort(
      (a: string, b: string) =>
        sensorPriority.indexOf(a) -
        sensorPriority.indexOf(b)
    );

    return {
      x: sortedSensors[0],
      y: sortedSensors[1],
    };
  };

  // ダミーデータからセンサーの値を取得
  const getSensorValue = (
    data: any,
    sensor: string
  ) => {

    switch (sensor) {

      case "air":
        return data.outsideTemp;

      case "water":
        return data.waterTemp;

      case "salt":
        return data.salinity;

      case "oxygen":
        return data.dissolvedOxygen;

      default:
        return null;
    }
  };

  // 期間に対応するダミーデータを取得
  const getDataForPeriod = (period: any) => {

    if (!dummyData.length) {
      return [];
    }

    return dummyData.filter((item: any) => {

      const date = new Date(item.timestamp);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      switch (settings?.graphPeriod) {

        case "year":
          return year === period.year;

        case "month":
          return (
            year === period.year &&
            month === period.month
          );

        case "day":
          return (
            year === period.year &&
            month === period.month &&
            day === period.day
          );

        default:
          return false;
      }
    });
  };

  // センサーの表示名
  const getSensorNameByValue = (sensor: string) => {

    const names: { [key: string]: string } = {
      air: "気温",
      water: "水温",
      salt: "塩分濃度",
      oxygen: "溶存酸素",
    };

    return names[sensor] ?? "";
  };

  // 期間の表示名
  const getPeriodText = (period: any) => {

    if (!settings) return "";

    switch (settings.graphPeriod) {

      case "year":
        return `${period.year}`;

      case "month":
        return `${period.year}/${String(period.month).padStart(2, "0")}`;

      case "day":
        return `${period.year}/${String(period.month).padStart(2, "0")}/${String(period.day).padStart(2, "0")}`;

      default:
        return "";
    }
  };

  // 相関図の設定
  const getCorrelationChartOption = () => {

    const axes = getCorrelationAxes();

    if (!axes || !settings || dummyData.length === 0) {
      return {};
    }

    return {
      grid: {
        left: 60,
        right: 20,
        top: 30,
        bottom: 60,
      },

      xAxis: {
        type: "value",
        name: getSensorNameByValue(axes.x),
        nameLocation: "middle",
        nameGap: 35,
      },

      yAxis: {
        type: "value",
        name: getSensorNameByValue(axes.y),
        nameLocation: "middle",
        nameGap: 35,
      },

      series: settings.periods.map((period: any) => {

        // 設定された期間のデータを取得
        const periodData = getDataForPeriod(period);

        // X軸・Y軸のデータを作成
        const data = periodData
          .map((item: any) => {

            const x = getSensorValue(
              item,
              axes.x
            );

            const y = getSensorValue(
              item,
              axes.y
            );

            if (x === null || y === null) {
              return null;
            }

            return [x, y];
          })
          .filter((item: any) => item !== null);

        return {
          type: "scatter",

          name: getPeriodText(period),

          data,

          symbolSize: 10,

          itemStyle: {
            color: period.color,
          },
        };
      }),
    };
  };

  const axes = getCorrelationAxes();

  // ComparePage側から呼ばれたが、
  // 相関図を描画できない状態なら何も表示しない
  if (!settings || !settings.correlationMode || !axes) {
    return null;
  }

  return (
    <div className="correlation-chart-area">

      <ReactECharts
        option={getCorrelationChartOption()}
        style={{
          width: "100%",
          height: "500px",
        }}
      />

    </div>
  );
}