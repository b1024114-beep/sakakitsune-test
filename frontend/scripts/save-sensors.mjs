import Papa from "papaparse";

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

function toNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value.trim() === "" ||
    value.trim() === "null"
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

async function main() {
  console.log("センサーデータ取得テスト開始");

  let total = 0;
  let failed = 0;

  for (const source of SOURCES) {
    console.log(`\n--- ${source.name} ---`);

    const url = process.env[source.envName];

    if (!url) {
      console.error(`${source.envName} が設定されていません。`);
      failed++;
      continue;
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "sensor-data-collector/1.0",
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP status: ${response.status}`);
      }

      const csvText = await response.text();

      const parsed = Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        console.warn("CSV解析時の警告:", parsed.errors.slice(0, 3));
      }

      const rows = parsed.data
        .filter(
          (row) => row[0]?.trim() === source.csvId && row[1]
        )
        .slice(0, 10);

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

      console.log("取得・解析成功");
      console.log("解析件数:", records.length);
      console.log("データ例:", records.slice(0, 3));

      total += records.length;
    } catch (error) {
      console.error("取得・解析失敗:", error.message);
      failed++;
    }
  }

  console.log("\n--- テスト結果 ---");
  console.log("解析した合計件数:", total);
  console.log("失敗したセンサー数:", failed);
  console.log("Supabaseへの保存は行っていません。");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();