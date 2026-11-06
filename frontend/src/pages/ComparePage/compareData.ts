
// 比較できるセンサーの種類
export type SensorKey = "air" | "water" | "salt" | "oxygen";

// 比較する1期間分の設定
export type Period = {
  id: number;
  color: string;
  year: number;
  month: number;
  day: number;
  oxygenSensor?: "oxygen1" | "oxygen2" | "oxygen3";
};

// 比較画面の設定全体
export type CompareSettings = {
  correlationMode: boolean;
  sensorType: SensorKey;
  correlationSensors: SensorKey[];
  graphPeriod: "day" | "month" | "year";
  periods: Period[];
};

// 種類ごとの単位
const SENSOR_UNIT: Record<SensorKey, string> = {
  air: "℃",
  water: "℃",
  salt: "‰",
  oxygen: "mg/L",
};

export function getSensorUnit(sensor: SensorKey): string {
  return SENSOR_UNIT[sensor];
}

