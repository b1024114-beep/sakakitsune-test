// 比較画面用：ダミーデータをグラフで使える形に変換する
import juneData from "./june.json";
import julyData from "./july.json";

// 比較できるセンサーの種類
export type SensorKey = "air" | "water" | "salt" | "oxygen";

// 比較する1期間分の設定
export type Period = {
  id: number;
  color: string;
  year: number;
  month: number;
  day: number;
};

// 比較画面の設定全体
export type CompareSettings = {
  correlationMode: boolean;
  sensorType: SensorKey;
  correlationSensors: SensorKey[];
  graphPeriod: "day" | "month" | "year";
  periods: Period[];
};

// ダミーデータ(june.json/july.json)1件分の形
type SensorRecord = {
  sensorId: string;
  timestamp: string;
  battery: number;
  outsideTemp: number;
  waterTemp: number;
  conductivity: number;
  salinity: number;
  dissolvedOxygen: number;
};

// 種類(SensorKey) → ダミーデータのどのフィールドを見るか
const SENSOR_FIELD: Record<SensorKey, keyof SensorRecord> = {
  air: "outsideTemp",
  water: "waterTemp",
  salt: "salinity",
  oxygen: "dissolvedOxygen",
};

// 種類ごとの単位
const SENSOR_UNIT: Record<SensorKey, string> = {
  air: "℃",
  water: "℃",
  salt: "‰",
  oxygen: "mg/L",
};

// 6月・7月のダミーデータを1つの配列にまとめる
const allRecords: SensorRecord[] = [
  ...(juneData as { data: SensorRecord[] }).data,
  ...(julyData as { data: SensorRecord[] }).data,
];

// タイムスタンプから年月日を取り出す
const parseDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

export function getSensorUnit(sensor: SensorKey) {
  return SENSOR_UNIT[sensor];
}

// 月内の日ごとの値（日 → 値）
export function getMonthSeries(year: number, month: number, sensor: SensorKey) {
  const field = SENSOR_FIELD[sensor];
  const map = new Map<number, number>();

  allRecords.forEach((record) => {
    const { year: y, month: m, day } = parseDate(record.timestamp);
    if (y === year && m === month) {
      map.set(day, record[field] as number);
    }
  });

  return map;
}

// 年内の月ごとの平均値（月 → 値）
export function getYearSeries(year: number, sensor: SensorKey) {
  const field = SENSOR_FIELD[sensor];
  const sums = new Map<number, { total: number; count: number }>();

  // まず月ごとに合計値と件数を集計する
  allRecords.forEach((record) => {
    const { year: y, month } = parseDate(record.timestamp);
    if (y !== year) return;

    const entry = sums.get(month) ?? { total: 0, count: 0 };
    entry.total += record[field] as number;
    entry.count += 1;
    sums.set(month, entry);
  });

  // 集計した合計値と件数から、月ごとの平均値を出す
  const map = new Map<number, number>();
  sums.forEach((entry, month) => {
    map.set(month, Number((entry.total / entry.count).toFixed(2)));
  });

  return map;
}

// 特定の1日の値
export function getDayValue(
  year: number,
  month: number,
  day: number,
  sensor: SensorKey
) {
  const field = SENSOR_FIELD[sensor];

  const record = allRecords.find((r) => {
    const parsed = parseDate(r.timestamp);
    return parsed.year === year && parsed.month === month && parsed.day === day;
  });

  return record ? (record[field] as number) : null;
}
