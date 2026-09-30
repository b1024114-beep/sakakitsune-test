import Papa from "papaparse";

const SENSOR_API_URL =
  "https://api.buoy.jp/buoy/wagri-dev.php?BUOY=10245e8";

const DO1_API_URL =
  "https://api.buoy.jp/buoy/wagri-dev.php?BUOY=101a4cd&DO=1";

const DO3_API_URL =
  "https://api.buoy.jp/buoy/wagri-dev.php?BUOY=101a508&DO=1";

// 基準時刻から最大5分まで離れたデータを使用
const MAX_TIME_DIFF = 5 * 60 * 1000;
// UTCの時刻を日本時間（JST）に変換
function toJST(datetime: string): string {
  const date = new Date(datetime);

  return (
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(date)
      .replace(" ", "T") + "+09:00"
  );
}
// 基準時刻に一番近いデータを探す
function findNearestRow(
  rows: string[][],
  targetTime: number
): string[] | null {
  let nearestRow: string[] | null = null;
  let nearestDiff = Infinity;

  for (const row of rows) {
    if (!row[1]) continue;

    const rowTime = new Date(row[1]).getTime();
    const diff = Math.abs(rowTime - targetTime);

    if (diff < nearestDiff) {
      nearestDiff = diff;
      nearestRow = row;
    }
  }

  // 5分以上離れていたら結合しない
  if (nearestDiff > MAX_TIME_DIFF) {
    return null;
  }

  return nearestRow;
}

export default async function handler(_request: any, response: any) {
  try {
    // 3つのAPIから同時にデータを取得
    const [sensorResponse, do1Response, do3Response] = await Promise.all([
      fetch(SENSOR_API_URL),
      fetch(DO1_API_URL),
      fetch(DO3_API_URL),
    ]);

    if (!sensorResponse.ok || !do1Response.ok || !do3Response.ok) {
      return response.status(500).json({
        error: "センサーデータの取得に失敗しました",
      });
    }

    // CSVを取得
    const sensorData = await sensorResponse.text();
    const do1Data = await do1Response.text();
    const do3Data = await do3Response.text();

    // CSVを配列に変換
    const sensorRows = Papa.parse<string[]>(sensorData, {
      header: false,
      skipEmptyLines: true,
    }).data;

    const do1Rows = Papa.parse<string[]>(do1Data, {
      header: false,
      skipEmptyLines: true,
    }).data;

    const do3Rows = Papa.parse<string[]>(do3Data, {
      header: false,
      skipEmptyLines: true,
    }).data;

    // 10245e8を基準にデータを結合
    const data = sensorRows.map((row) => {
      const datetime = row[1];
      const targetTime = new Date(datetime).getTime();

      // 基準時刻に一番近いDOデータを探す
      const do1Row = findNearestRow(do1Rows, targetTime);
      const do3Row = findNearestRow(do3Rows, targetTime);

      return {
        datetime: toJST(datetime),
        waterTemp: Number(row[4]),
        outsideTemp: Number(row[3]),
        salinity: Number(row[6]),
        oxygen1: do1Row ? Number(do1Row[6]) : null,
        oxygen3: do3Row ? Number(do3Row[6]) : null,
      };
    });

    return response.status(200).json(data);
  } catch (error) {
    console.error("センサーデータ取得エラー:", error);

    return response.status(500).json({
      error: "データ取得中にエラーが発生しました",
    });
  }
}