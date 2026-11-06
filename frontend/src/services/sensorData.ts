
export type SensorPosition = {
  latitude: number | null;
  longitude: number | null;
  latitudeDMS: string | null;
  longitudeDMS: string | null;
};

export type PositionKey = "salinity" | "DO01" | "DO02" | "DO03";

export type LatestSensorPositions = {
  positions: Record<PositionKey, SensorPosition>;
  datetime: string | null;
  positionDatetimes: Partial<Record<PositionKey, string>>;
};

export type SensorRecord = {
  datetime: string;
  waterTemp: number | null;
  outsideTemp: number | null;
  salinity: number | null;
  oxygen1: number | null;
  oxygen2: number | null;
  oxygen3: number | null;
  positions?: Record<PositionKey, SensorPosition>;
};

const CACHE_MS = 60 * 1000;

const cache = new Map<
  string,
  { request: Promise<SensorRecord[]>; fetchedAt: number }
>();

let latestPositionsCache:
  | { request: Promise<LatestSensorPositions>; fetchedAt: number }
  | undefined;

export const toDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const fetchSensorData = (date?: Date): Promise<SensorRecord[]> => {
  const dateString = date ? toDateString(date) : "";
  const cached = cache.get(dateString);

  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
    return cached.request;
  }

  const url = dateString
    ? `/api/sensors?date=${dateString}`
    : "/api/sensors";

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as SensorRecord[];
    })
    .catch((error) => {
      cache.delete(dateString);
      throw error;
    });

  cache.set(dateString, { request, fetchedAt: Date.now() });

  return request;
};

// 地図用：センサーごとの最新位置だけを取得する
export const fetchLatestSensorPositions =
  (): Promise<LatestSensorPositions> => {
    if (
      latestPositionsCache &&
      Date.now() - latestPositionsCache.fetchedAt < CACHE_MS
    ) {
      return latestPositionsCache.request;
    }

    const request = fetch("/api/sensors?positionsOnly=1")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return (await response.json()) as LatestSensorPositions;
      })
      .catch((error) => {
        latestPositionsCache = undefined;
        throw error;
      });

    latestPositionsCache = {
      request,
      fetchedAt: Date.now(),
    };

    return request;
  };
// ---- グラフ画面で共通に使う部品 ----

// 数値の項目名（"datetime" 以外）
type ValueField = Exclude<keyof SensorRecord, "datetime" | "positions">;

// 設定画面のDOセンサ → 統合データのどの項目か
export const DO_FIELD: Record<string, ValueField> = {
  DO01: "oxygen1",
  DO02: "oxygen2",
  DO03: "oxygen3",
};

// 画面の種類名 → 統合データの項目名（溶存酸素は設定画面で選んだDOセンサに合わせる）
export const getSensorField = (type: string): ValueField => {
  switch (type) {
    case "気温":
      return "outsideTemp";
    case "水温":
      return "waterTemp";
    case "塩分濃度":
      return "salinity";
    default:
      return DO_FIELD[localStorage.getItem("doSensor") ?? "DO01"] ?? "oxygen1";
  }
};

// グラフの1点分
export type GraphPoint = { label: string; value: number | null };

// null を除いて平均（全部 null なら null）
const average = (values: (number | null)[]) => {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
};

// 統合データ → グラフの点
//   日：baseDate の日の30分ごとの値（48点）
//   月：baseDate の月の1日ごとの平均（28〜31点）
//   年：baseDate の年の1か月ごとの平均（12点）
export const makeGraphPoints = (
  records: SensorRecord[],
  type: string,
  mode: string,
  baseDate = new Date()
): GraphPoint[] => {
  const field = getSensorField(type);
  const dateString = toDateString(baseDate); 

  // モードごとに「対象期間」「まとめる単位」「横軸のラベル一覧」を決める
  let prefix: string; // datetime の先頭がこれに一致するデータだけ使う
  let getKey: (datetime: string) => string;
  let labels: string[];

  if (mode === "日") {
    prefix = dateString;
    getKey = (dt) => {
      const timePart = dt.slice(11, 16); // "14:25"
      const [hour, min] = timePart.split(":");
      const roundedMin = Number(min) < 30 ? "00" : "30";
      return `${hour}:${roundedMin}`;
    };
    labels = Array.from({ length: 48 }, (_, i) =>
      `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`
    );
  } else if (mode === "月") {
    prefix = dateString.slice(0, 7); 
    getKey = (dt) => dt.slice(8, 10); 
    const days = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
    labels = Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, "0"));
  } else {
    prefix = dateString.slice(0, 4);
    getKey = (dt) => dt.slice(5, 7); 
    labels = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  }

  // 「日」モードの場合は、その日1日分（48点）の処理をそのまま行う
  if (mode === "日") {
    const groups = new Map<string, (number | null)[]>();
    for (const r of records) {
      if (!r.datetime.startsWith(prefix)) continue;
      const key = getKey(r.datetime);
      const values = groups.get(key) ?? [];
      values.push(r[field]);
      groups.set(key, values);
    }
    return labels.map((key) => ({ label: key, value: average(groups.get(key) ?? []) }));
  }

  // ★「月」「年」モードは全期間をシームレスに繋ぐための処理
  const groups = new Map<string, (number | null)[]>();
  
  for (const r of records) {
    // 月モードなら "YYYY-MM-DD"、年モードなら "YYYY-MM" を一意のキーにする
    const key = mode === "月" ? r.datetime.slice(0, 10) : r.datetime.slice(0, 7);
    if (!key) continue;
    
    const values = groups.get(key) ?? [];
    values.push(r[field]);
    groups.set(key, values);
  }

  // タイムラインが途切れないよう、データが存在する最古から最新までの全日付（月）の一覧を作る
  const sortedKeys = Array.from(groups.keys()).sort();
  if (sortedKeys.length === 0) return [];

  const allLabels: string[] = [];
  const start = new Date(sortedKeys[0]);
  const end = new Date(sortedKeys[sortedKeys.length - 1]);

  if (mode === "月") {
    // 最古の日から最新の日まで1日ずつループして "YYYY-MM-DD" の配列を作る
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allLabels.push(toDateString(d));
    }
  } else {
    // 最古の月から最新の月まで1ヶ月ずつループして "YYYY-MM" の配列を作る
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      allLabels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  }

  // 全期間のタイムラインに対して、データがあれば平均値をマッピングして返す
  return allLabels.map((key) => ({
    label: key, // 例: "2026-10-02" や "2026-10"
    value: average(groups.get(key) ?? [])
  }));
};
