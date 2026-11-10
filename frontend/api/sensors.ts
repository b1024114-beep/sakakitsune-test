
import { createClient } from "@supabase/supabase-js";

type SensorId = "salinity" | "do1" | "do2" | "do3";
type PositionKey = "salinity" | "DO01" | "DO02" | "DO03";

type SensorPosition = {
  latitude: number | null;
  longitude: number | null;
  latitudeDMS: string | null;
  longitudeDMS: string | null;
};

type SensorRecord = {
  datetime: string;
  waterTemp: number | null;
  outsideTemp: number | null;
  salinity: number | null;
  oxygen1: number | null;
  oxygen2: number | null;
  oxygen3: number | null;
  positions: Record<PositionKey, SensorPosition>;
};

type DbRow = {
  sensor_id: SensorId;
  datetime: string;
  water_temp: number | null;
  outside_temp: number | null;
  salinity: number | null;
  do_mgl: number | null;
  pos1: number | null;
  pos2: number | null;
  pos3: number | null;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabaseの環境変数が設定されていません。");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SENSOR_IDS: SensorId[] = [
  "salinity",
  "do1",
  "do2",
  "do3",
];

const POSITION_KEYS: Record<SensorId, PositionKey> = {
  salinity: "salinity",
  do1: "DO01",
  do2: "DO02",
  do3: "DO03",
};

const emptyPosition = (): SensorPosition => ({
  latitude: null,
  longitude: null,
  latitudeDMS: null,
  longitudeDMS: null,
});

// 既存APIと同じGPS変換
function convertGPS(
  a: number,
  b: number,
  c: number
) {
  const value = Math.round(a * 100);

  const latitudeDegree = Math.floor(value / 256);
  const longitudeDegree = value % 256;

  const latitudeMinute = b / 10;
  const longitudeMinute = c / 10;

  const latitudeDecimal =
    latitudeDegree + latitudeMinute / 60;

  const longitudeDecimal =
    longitudeDegree + longitudeMinute / 60;

  return {
    latitude: latitudeDecimal,
    longitude: longitudeDecimal,
    latitudeDMS: `${latitudeDegree}°${latitudeMinute.toFixed(3)}'N`,
    longitudeDMS: `${longitudeDegree}°${longitudeMinute.toFixed(3)}'E`,
  };
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

// UTCの日時をJSTの分単位に変換
function toJstKey(value: string): string {
  const date = new Date(value);

  date.setHours(date.getHours() + 9);

  return date.toISOString().substring(0, 16) + ":00";
}

function hasPosition(row: DbRow): boolean {
  return (
    row.pos1 !== null &&
    row.pos2 !== null &&
    row.pos3 !== null
  );
}

// Supabaseの最大取得件数を考慮して全件取得
async function fetchAllRows(
  sensorId: SensorId,
  date?: string
): Promise<DbRow[]> {
  const allRows: DbRow[] = [];
  const pageSize = 1000;

    let start: string | null = null;
  let end: string | null = null;

  if (date) {
    let startDate: Date;
    let endDate: Date;

    if (/^\d{4}$/.test(date)) {
      // 年単位：2026 → 2026年1月1日～2027年1月1日
      const year = Number(date);
      startDate = new Date(`${year}-01-01T00:00:00+09:00`);
      endDate = new Date(`${year + 1}-01-01T00:00:00+09:00`);
    } else if (/^\d{4}-\d{2}$/.test(date)) {
      // 月単位：2026-10 → 2026年10月1日～11月1日
      const [year, month] = date.split("-").map(Number);
      startDate = new Date(`${date}-01T00:00:00+09:00`);
      endDate = new Date(
        `${year + (month === 12 ? 1 : 0)}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01T00:00:00+09:00`
      );
    } else {
      // 日単位：2026-10-15 → その日1日分
      startDate = new Date(`${date}T00:00:00+09:00`);
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }

    start = startDate.toISOString();
    end = endDate.toISOString();
  }
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from("sensor_readings")
      .select(
        "sensor_id,datetime,water_temp,outside_temp,salinity,do_mgl,pos1,pos2,pos3"
      )
      .eq("sensor_id", sensorId)
      .order("datetime", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (start && end) {
      query = query
        .gte("datetime", start)
        .lt("datetime", end);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as DbRow[];

    allRows.push(...rows);

    if (rows.length < pageSize) {
      break;
    }
  }

  return allRows;
}

// センサーごとの最新の有効な位置を取得
async function fetchLatestPosition(
  sensorId: SensorId
): Promise<DbRow | null> {
  const { data, error } = await supabase
    .from("sensor_readings")
    .select(
      "sensor_id,datetime,water_temp,outside_temp,salinity,do_mgl,pos1,pos2,pos3"
    )
    .eq("sensor_id", sensorId)
    .not("pos1", "is", null)
    .not("pos2", "is", null)
    .not("pos3", "is", null)
    .order("datetime", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as DbRow | null) ?? null;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const date =
    typeof req.query.date === "string"
      ? req.query.date
      : undefined;

  const positionsOnly =
    req.query.positionsOnly === "1";

  if (
  date &&
  !/^(\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$/.test(date)
) {
  return res.status(400).json({
    error: "日付の形式が正しくありません。",
  });
}

  try {
    // 最新位置だけを取得
    if (positionsOnly) {
      const results = await Promise.all(
        SENSOR_IDS.map(async (sensorId) => ({
          sensorId,
          row: await fetchLatestPosition(sensorId),
        }))
      );

      const positions: Record<
        PositionKey,
        SensorPosition
      > = {
        salinity: emptyPosition(),
        DO01: emptyPosition(),
        DO02: emptyPosition(),
        DO03: emptyPosition(),
      };

      const positionDatetimes: Partial<
        Record<PositionKey, string>
      > = {};

      let latestDatetime: string | null = null;

      for (const { sensorId, row } of results) {
        if (!row || !hasPosition(row)) continue;

        const key = POSITION_KEYS[sensorId];
        const gps = convertGPS(
          row.pos1!,
          row.pos2!,
          row.pos3!
        );

        positions[key] = gps;
        positionDatetimes[key] = toJstKey(row.datetime);

        if (
          !latestDatetime ||
          new Date(row.datetime) > new Date(latestDatetime)
        ) {
          latestDatetime = row.datetime;
        }
      }

      return res.status(200).json({
        positions,
        datetime: latestDatetime
          ? toJstKey(latestDatetime)
          : null,
        positionDatetimes,
      });
    }

    // 4種類のセンサーをSupabaseから取得
    const results = await Promise.all(
      SENSOR_IDS.map((sensorId) =>
        fetchAllRows(sensorId, date)
      )
    );

    const recordMap = new Map<string, SensorRecord>();

    for (const rows of results) {
      for (const row of rows) {
        const key = toJstKey(row.datetime);

        if (!recordMap.has(key)) {
          recordMap.set(key, {
            datetime: key,
            waterTemp: null,
            outsideTemp: null,
            salinity: null,
            oxygen1: null,
            oxygen2: null,
            oxygen3: null,
            positions: {
              salinity: emptyPosition(),
              DO01: emptyPosition(),
              DO02: emptyPosition(),
              DO03: emptyPosition(),
            },
          });
        }

        const record = recordMap.get(key)!;

        if (row.sensor_id === "salinity") {
  record.waterTemp = toNullableNumber(row.water_temp);
  record.outsideTemp = toNullableNumber(row.outside_temp);
  record.salinity = toNullableNumber(row.salinity);
}

if (row.sensor_id === "do1") {
  record.oxygen1 = toNullableNumber(row.do_mgl);
}

if (row.sensor_id === "do2") {
  record.oxygen2 = toNullableNumber(row.do_mgl);
}

if (row.sensor_id === "do3") {
  record.oxygen3 = toNullableNumber(row.do_mgl);
}

        if (hasPosition(row)) {
          const gps = convertGPS(
            row.pos1!,
            row.pos2!,
            row.pos3!
          );

          record.positions[POSITION_KEYS[row.sensor_id]] =
            gps;
        }
      }
    }

    const records = Array.from(recordMap.values()).sort(
      (a, b) =>
        new Date(a.datetime).getTime() -
        new Date(b.datetime).getTime()
    );

    res.setHeader(
      "Cache-Control",
      "s-maxage=60, stale-while-revalidate=300"
    );

    return res.status(200).json(records);
  } catch (error) {
    console.error("Supabase sensor data error:", error);

    return res.status(502).json({
      error: "Supabaseからのデータ取得に失敗しました。",
    });
  }
}
