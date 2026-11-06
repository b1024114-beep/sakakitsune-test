
import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import "./CompareScatter.css";
import { getSensorUnit } from "./compareData";
import type { CompareSettings, SensorKey } from "./compareData";

type CompareScatterProps = {
  settings: CompareSettings;
};

type SensorData = {
  datetime: string;
  waterTemp: number | null;
  outsideTemp: number | null;
  salinity: number | null;
  oxygen1: number | null;
  oxygen2: number | null;
  oxygen3: number | null;
};

type ScatterPoint = [number, number];

type ScatterSeries = {
  type: "scatter";
  name: string;
  data: ScatterPoint[];
  symbolSize: number;
  itemStyle: {
    color: string;
  };
};

type CorrelationAxes = {
  x: SensorKey;
  y: SensorKey;
};

type AxisRange = {
  min?: number;
  max?: number;
  interval?: number;
};

export default function CompareScatter({
  settings,
}: CompareScatterProps) {
  const [sensorData, setSensorData] = useState<
    Record<number, SensorData[]>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // センサーの並び順
  const sensorPriority: SensorKey[] = [
    "air",
    "water",
    "salt",
    "oxygen",
  ];

  // APIからデータを取得
  useEffect(() => {
    let cancelled = false;

    if (settings.periods.length === 0) {
      setSensorData({});
      setHasError(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const fetchData = async () => {
      const results: Record<number, SensorData[]> = {};

      try {
        await Promise.all(
          settings.periods.map(async (period) => {
            let date = "";

            // 日：その日のデータを取得
            if (settings.graphPeriod === "day") {
              date = `${period.year}-${String(
                period.month
              ).padStart(2, "0")}-${String(
                period.day
              ).padStart(2, "0")}`;
            } else if (settings.graphPeriod === "month") {
              date = `${period.year}-${String(
                period.month
              ).padStart(2, "0")}`;
            } else if (settings.graphPeriod === "year") {
              date = String(period.year);
            }

            const response = await fetch(
              `/api/sensors?date=${date}`
            );

            if (!response.ok) {
              throw new Error(
                `API error: ${response.status}`
              );
            }

            const data: SensorData[] =
              await response.json();

            results[period.id] = data;
          })
        );

        if (!cancelled) {
          setSensorData(results);
          setHasError(false);
        }
      } catch (error) {
        console.error(
          "相関図のセンサーデータ取得エラー:",
          error
        );

        if (!cancelled) {
          setSensorData({});
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [settings.graphPeriod, settings.periods]);

  // 相関図のX軸・Y軸に使用するセンサーを取得
  const getCorrelationAxes = (): CorrelationAxes | null => {
    if (!settings.correlationMode) {
      return null;
    }

    const sensors = settings.correlationSensors;

    if (sensors.length !== 2) {
      return null;
    }

    const sortedSensors = [...sensors].sort(
      (a, b) =>
        sensorPriority.indexOf(a) -
        sensorPriority.indexOf(b)
    );

    return {
      x: sortedSensors[0],
      y: sortedSensors[1],
    };
  };

  // センサー名を表示用に変換
  const getSensorNameByValue = (sensor: SensorKey) => {
    const names: Record<SensorKey, string> = {
      air: "気温",
      water: "水温",
      salt: "塩分濃度",
      oxygen: "溶存酸素",
    };

    return names[sensor];
  };

  // センサー名からAPIデータのフィールド名を取得
  // DOセンサーは期間ごとの選択内容を使用
  const getSensorField = (
    sensor: SensorKey,
    period: CompareSettings["periods"][number]
  ): keyof Omit<SensorData, "datetime"> => {
    switch (sensor) {
      case "air":
        return "outsideTemp";

      case "water":
        return "waterTemp";

      case "salt":
        return "salinity";

      case "oxygen":
        return period.oxygenSensor ?? "oxygen1";
    }
  };

  // DOセンサーの表示名
  const DO_NAMES: Record<
    "oxygen1" | "oxygen2" | "oxygen3",
    string
  > = {
    oxygen1: "DO1",
    oxygen2: "DO2",
    oxygen3: "DO3",
  };

  // 選択した期間の表示名
  const getPeriodText = (
    period: CompareSettings["periods"][number]
  ) => {
    let dateText = "";

    switch (settings.graphPeriod) {
      case "year":
        dateText = `${period.year}`;
        break;

      case "month":
        dateText = `${period.year}/${String(
          period.month
        ).padStart(2, "0")}`;
        break;

      case "day":
        dateText = `${period.year}/${String(
          period.month
        ).padStart(2, "0")}/${String(
          period.day
        ).padStart(2, "0")}`;
        break;
    }

    // 相関図で溶存酸素を使う場合はDO番号も表示
    if (settings.correlationSensors.includes("oxygen")) {
      const oxygenSensor =
        period.oxygenSensor ?? "oxygen1";

      return `${dateText}/${DO_NAMES[oxygenSensor]}`;
    }

    return dateText;
  };

  // 数値の平均を求める
  const getAverage = (
    values: (number | null)[]
  ): number | null => {
    const validValues = values.filter(
      (value): value is number =>
        typeof value === "number" &&
        Number.isFinite(value)
    );

    if (validValues.length === 0) {
      return null;
    }

    return (
      validValues.reduce(
        (sum, value) => sum + value,
        0
      ) / validValues.length
    );
  };

  // 指定した期間の平均データを作る
  const createAverageRecord = (
    datetime: string,
    records: SensorData[]
  ): SensorData => {
    return {
      datetime,

      waterTemp: getAverage(
        records.map((item) => item.waterTemp)
      ),

      outsideTemp: getAverage(
        records.map((item) => item.outsideTemp)
      ),

      salinity: getAverage(
        records.map((item) => item.salinity)
      ),

      oxygen1: getAverage(
        records.map((item) => item.oxygen1)
      ),

      oxygen2: getAverage(
        records.map((item) => item.oxygen2)
      ),

      oxygen3: getAverage(
        records.map((item) => item.oxygen3)
      ),
    };
  };

  // 日ごとの平均データを作る
  const createDailyAverageData = (
    data: SensorData[]
  ): SensorData[] => {
    const dailyData: SensorData[] = [];

    for (let day = 1; day <= 31; day++) {
      const targetDay = String(day).padStart(
        2,
        "0"
      );

      const records = data.filter((item) =>
        item.datetime.includes(`-${targetDay}T`)
      );

      if (records.length === 0) {
        continue;
      }

      dailyData.push(
        createAverageRecord(targetDay, records)
      );
    }

    return dailyData;
  };

  // 月ごとの平均データを作る
  const createMonthlyAverageData = (
    data: SensorData[]
  ): SensorData[] => {
    const monthlyData: SensorData[] = [];

    for (let month = 1; month <= 12; month++) {
      const targetMonth = String(month).padStart(
        2,
        "0"
      );

      const records = data.filter((item) =>
        item.datetime.includes(`-${targetMonth}-`)
      );

      if (records.length === 0) {
        continue;
      }

      monthlyData.push(
        createAverageRecord(targetMonth, records)
      );
    }

    return monthlyData;
  };

  // 軸の範囲を取得
  const getAxisRange = (
    sensor: SensorKey
  ): AxisRange => {
    if (sensor === "salt") {
      return {
        min: 25,
        max: 35,
        interval: 1,
      };
    }

    if (sensor === "oxygen") {
      return {
        min: 2,
        max: 9,
        interval: 1,
      };
    }

    return {};
  };

  // 軸の数値表示を設定
  const getAxisLabelFormatter = (
    sensor: SensorKey
  ) => {
    return (value: number) =>
      sensor === "oxygen"
        ? value.toFixed(1)
        : String(value);
  };

  // 相関図に描画するデータを作成
  const createCorrelationSeries = (
    axes: CorrelationAxes
  ): ScatterSeries[] => {
    return settings.periods.map((period) => {
      const xField = getSensorField(
        axes.x,
        period
      );

      const yField = getSensorField(
        axes.y,
        period
      );

      let periodData =
        sensorData[period.id] ?? [];

      /*
       * 日：30分ごとのデータを使用
       *
       * 月：1日ごとの平均を使用
       *
       * 年：1か月ごとの平均を使用
       */

      if (settings.graphPeriod === "month") {
        periodData =
          createDailyAverageData(periodData);
      } else if (settings.graphPeriod === "year") {
        periodData =
          createMonthlyAverageData(periodData);
      }

      const data: ScatterPoint[] = periodData
        .map((record) => {
          const x = record[xField];
          const y = record[yField];

          if (
            typeof x !== "number" ||
            !Number.isFinite(x) ||
            typeof y !== "number" ||
            !Number.isFinite(y)
          ) {
            return null;
          }

          return [x, y] as ScatterPoint;
        })
        .filter(
          (
            point
          ): point is ScatterPoint =>
            point !== null
        );

      return {
        type: "scatter",
        name: getPeriodText(period),
        data,
        symbolSize: 10,

        itemStyle: {
          color: period.color,
        },
      };
    });
  };

  // 相関図のグラフ設定
  // 相関図のグラフ設定
const getCorrelationChartOption = (
  axes: CorrelationAxes,
  series: ScatterSeries[]
) => {
  return {
    grid: {
      left: 60,
      right: 20,
      top: 10,
      bottom: 90,
    },

    xAxis: {
      type: "value" as const,
      ...getAxisRange(axes.x),

      name: `${getSensorNameByValue(
        axes.x
      )} [${getSensorUnit(axes.x)}]`,

      nameLocation: "middle" as const,
      nameGap: 25,

      axisLabel: {
        formatter: getAxisLabelFormatter(axes.x),
      },
    },

    yAxis: {
      type: "value" as const,
      ...getAxisRange(axes.y),

      name: `${getSensorNameByValue(
        axes.y
      )} [${getSensorUnit(axes.y)}]`,

      nameLocation: "middle" as const,
      nameGap: 35,
      axisLabel: {
        formatter: getAxisLabelFormatter(axes.y),
      },
    },

    series,
  };
};

  const axes = getCorrelationAxes();

  if (!settings.correlationMode || !axes) {
    return null;
  }

  // 実際に描画する散布図データを作成
  const series = createCorrelationSeries(axes);

  // 固定範囲の軸から外れていないかも確認
  const xRange = getAxisRange(axes.x);
  const yRange = getAxisRange(axes.y);

  const isVisiblePoint = (
    point: ScatterPoint
  ) => {
    const [x, y] = point;

    const xInRange =
      (xRange.min === undefined || x >= xRange.min) &&
      (xRange.max === undefined || x <= xRange.max);

    const yInRange =
      (yRange.min === undefined || y >= yRange.min) &&
      (yRange.max === undefined || y <= yRange.max);

    return xInRange && yInRange;
  };

  // すべての期間に描画可能なデータがないか判定
  const hasNoData =
    settings.periods.length > 0 &&
    series.every(
      (item) =>
        !item.data.some(isVisiblePoint)
    );

  return (
  <div className="correlation-chart-area">
    {isLoading ? (
      <div className="correlation-chart-message">
        <div className="compare-spinner" />
        データを取得中...
      </div>
    ) : hasError ? (
      <div className="correlation-chart-message">
        データを取得できませんでした
      </div>
    ) : settings.periods.length === 0 ? (
      <div className="correlation-chart-message">
        比較する期間を選択してください
      </div>
    ) : (
      <div className="correlation-chart-with-overlay">
        <ReactECharts
          option={getCorrelationChartOption(
            axes,
            series
          )}
          notMerge
          style={{
            width: "100%",
            height: "450px",
          }}
        />

        {hasNoData && (
          <div className="compare-error-overlay">
            <div className="compare-error-card">
              <p>データがありません。</p>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);
}
