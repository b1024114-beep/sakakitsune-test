
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

const SOURCES = [
  {
    name: "salinity",
    csvId: "10245e8",
    envName: "SALINITY_API_URL",
  },
  {
    name: "do1",
    csvId: "101a508",
    envName: "DO1_API_URL",
  },
  {
    name: "do3",
    csvId: "101a4cd",
    envName: "DO3_API_URL",
  },
];

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabaseの環境変数が設定されていません。");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

function toNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  if (text === "" || text === "null") {
    return null;
  }

  const number = Number(text);

  return Number.isFinite(number) ? number : null;
}

async function saveRecords(records, sensorName) {
  if (records.length === 0) {
    console.log("保存対象の新しいデータはありません。");
    return 0;
  }

  const batchSize = 500;
  let saved = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const { error } = await supabase
      .from("sensor_readings")
      .upsert(batch, {
        onConflict: "sensor_id,datetime",
      });

    if (error) {
      throw new Error(
        `${sensorName}のSupabase保存失敗: ${error.message}`
      );
    }

    saved += batch.length;
    console.log(`保存進捗: ${saved}/${records.length}件`);
  }

  return saved;
}

async function main() {
  console.log("センサーデータ取得・保存開始");

  let total = 0;
  let failed = 0;

  for (const source of SOURCES) {
    console.log(`\n--- ${source.name} ---`);

    try {
      const url = process.env[source.envName];

      if (!url) {
        throw new Error(`${source.envName} が設定されていません。`);
      }

      // CSV取得
      const response = await fetch(url, {
        headers: {
          "User-Agent": "sensor-data-collector/1.0",
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`CSV取得失敗: HTTP ${response.status}`);
      }

      const csvText = await response.text();

      // CSV解析
      const parsed = Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        console.warn(
          "CSV解析時の警告:",
          parsed.errors.slice(0, 3)
        );
      }

      const rows = parsed.data.filter(
        (row) => row[0]?.trim() === source.csvId && row[1]
      );

      const records = [];

      for (const row of rows) {
        const datetime = new Date(row[1]);

        if (Number.isNaN(datetime.getTime())) {
          continue;
        }

        const record = {
          sensor_id: source.name,
          datetime: datetime.toISOString(),
          battery: toNumber(row[2]),
          water_temp: toNumber(row[3]),
          outside_temp: toNumber(row[4]),
          salinity: null,
          do_percent: null,
          do_mgl: null,
          pos1: toNumber(row[7]),
          pos2: toNumber(row[8]),
          pos3: toNumber(row[9]),
        };

        if (source.name === "salinity") {
          record.salinity = toNumber(row[6]);
        } else {
          record.do_percent = toNumber(row[5]);
          record.do_mgl = toNumber(row[6]);
        }

        records.push(record);
      }

      console.log("CSV解析件数:", records.length);

      // Supabaseにある最新日時を確認
      const { data: latest, error: latestError } = await supabase
        .from("sensor_readings")
        .select("datetime")
        .eq("sensor_id", source.name)
        .order("datetime", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        throw new Error(
          `最新データの確認失敗: ${latestError.message}`
        );
      }

      // 最新データの1時間前以降を保存対象にする
      // 遅れて届いたデータも取り込めるようにする
      const cutoff = latest?.datetime
        ? new Date(latest.datetime).getTime() - 60 * 60 * 1000
        : -Infinity;

      const newRecords = records.filter(
        (record) => new Date(record.datetime).getTime() >= cutoff
      );

      console.log("保存対象件数:", newRecords.length);

      // Supabaseへ保存
      const saved = await saveRecords(
        newRecords,
        source.name
      );

      console.log(`${source.name}: ${saved}件保存完了`);

      total += saved;
    } catch (error) {
      console.error(
        `${source.name}の処理失敗:`,
        error.message
      );

      failed++;
    }
  }

  console.log("\n--- 実行結果 ---");
  console.log("保存した合計件数:", total);
  console.log("失敗したセンサー数:", failed);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("処理全体でエラーが発生しました:", error);
  process.exitCode = 1;
});
