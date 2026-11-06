
import "./DataPage.css";
import { Icons } from "@/components/materials";
import PageLayout from "@/components/PageLayout";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  fetchSensorData,
  type SensorRecord,
} from "@/services/sensorData";

// 時間を30分刻みの配列で定義
const times = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

const DAY_MS = 24 * 60 * 60 * 1000;

// 現在時刻から最新の30分単位の時間を取得
const getLatestTime = () => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = now.getMinutes();
  const roundedMinute = minute < 30 ? "00" : "30";
  return `${hour}:${roundedMinute}`;
};

// 日付の表示フォーマット
const formatDate = (date: Date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const week = ["日", "月", "火", "水", "木", "金", "土"][
    date.getDay()
  ];
  return `${month}月${day}日（${week}）`;
};

// 日時の表示フォーマット
const formatDateTime = (datetime: string | null) => {
  if (!datetime) return "記録されたデータがありません";

  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) {
    return "記録されたデータがありません";
  }

  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")
    }:${String(date.getMinutes()).padStart(2, "0")}`;
};

// 設定画面のDOセンサと統合データの項目の対応
const DO_FIELD: Record<
  string,
  "oxygen1" | "oxygen2" | "oxygen3"
> = {
  DO01: "oxygen1",
  DO02: "oxygen2",
  DO03: "oxygen3",
};

type ValueField =
  | "outsideTemp"
  | "waterTemp"
  | "salinity"
  | "oxygen1"
  | "oxygen2"
  | "oxygen3";

type FieldStatus = {
  value: number | null;
  latestDatetime: string | null;
  stale: boolean;
  error: boolean;
};

const hasAnyValue = (record: SensorRecord) =>
  record.outsideTemp !== null ||
  record.waterTemp !== null ||
  record.salinity !== null ||
  record.oxygen1 !== null ||
  record.oxygen2 !== null ||
  record.oxygen3 !== null;

export default function DataPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [doSensor, setDoSensor] = useState("DO01");

  const [selectedDate, setSelectedDate] = useState<Date>(
    location.state?.selectedDate
      ? new Date(location.state.selectedDate)
      : new Date()
  );

  const [time, setTime] = useState<string>(
    location.state?.time ?? getLatestTime()
  );

  // 選択時刻のデータ
  const [record, setRecord] = useState<SensorRecord | null>(null);

  // 全期間のデータ。前日以前のデータも欠損判定に使用する
  const [allRecords, setAllRecords] = useState<SensorRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const savedDoSensor = localStorage.getItem("doSensor");
    if (savedDoSensor && DO_FIELD[savedDoSensor]) {
      setDoSensor(savedDoSensor);
    }
  }, []);

  // 全期間のデータを取得する
  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setFetchError(false);

      try {
        const records = await fetchSensorData();

        if (ignore) return;

        const sorted = [...records].sort((a, b) =>
          a.datetime.localeCompare(b.datetime)
        );

        setAllRecords(sorted);
      } catch (error) {
        console.error("センサデータの取得に失敗しました:", error);

        if (!ignore) {
          setAllRecords([]);
          setFetchError(true);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [selectedDate, time]);

  // 選択日時と一致するデータを取得
  const dateString = [
    selectedDate.getFullYear(),
    String(selectedDate.getMonth() + 1).padStart(2, "0"),
    String(selectedDate.getDate()).padStart(2, "0"),
  ].join("-");

  const targetDatetime = `${dateString}T${time}:00`;
  const targetMs = new Date(targetDatetime).getTime();

  useEffect(() => {
    const target = allRecords.find(
      (r) => r.datetime.slice(0, 16) === targetDatetime.slice(0, 16)
    );

    setRecord(target ?? null);
  }, [allRecords, targetDatetime]);

  // 選択日時以前で、指定項目に値がある最新の記録を取得
  const getLatestFieldRecord = (field: ValueField) => {
    for (let i = allRecords.length - 1; i >= 0; i--) {
      const item = allRecords[i];

      if (new Date(item.datetime).getTime() > targetMs) continue;

      if (item[field] !== null && Number.isFinite(item[field])) {
        return item;
      }
    }

    return null;
  };

  // 各項目の表示状態を計算
  const getFieldStatus = (field: ValueField): FieldStatus => {
    const currentValue = record?.[field] ?? null;

    // 選択時刻に有効な数値がある場合
    if (
      currentValue !== null &&
      Number.isFinite(currentValue)
    ) {
      return {
        value: currentValue,
        latestDatetime: record?.datetime ?? null,
        stale: false,
        error: false,
      };
    }

    const latest = getLatestFieldRecord(field);
    const latestMs = latest
      ? new Date(latest.datetime).getTime()
      : null;

    const gap = latestMs === null ? Infinity : targetMs - latestMs;
    const error = gap >= DAY_MS;

    return {
      value: error ? null : latest?.[field] ?? null,
      latestDatetime: latest?.datetime ?? null,
      stale: !error && latest !== null,
      error,
    };
  };

  const outsideStatus = getFieldStatus("outsideTemp");
  const waterStatus = getFieldStatus("waterTemp");
  const salinityStatus = getFieldStatus("salinity");
  const doStatus = getFieldStatus(DO_FIELD[doSensor]);

  // 選択時刻にどの項目の数値もない場合は、センサー全体の欠損と判定
  const hasCurrentData = record !== null && hasAnyValue(record);

  // 選択日時以前で、いずれかの項目に値がある最新の記録を取得
  const latestOverallRecord = (() => {
    for (let i = allRecords.length - 2; i >= 0; i--) {
      const item = allRecords[i];
      const itemMs = new Date(item.datetime).getTime();

      // 選択日時より後のデータは対象外
      if (itemMs > targetMs) continue;

      // いずれかの項目に有効な数値がある記録を採用
      if (hasAnyValue(item)) {
        return item;
      }
    }

    return null;
  })();

  // 最後にデータが記録された時刻からの経過時間
  const overallGap = latestOverallRecord
    ? targetMs - new Date(latestOverallRecord.datetime).getTime()
    : Infinity;

  const wholePageError =
    !loading &&
    !fetchError &&
    !hasCurrentData &&
    overallGap >= DAY_MS;

  // データ全体の取得自体に失敗した場合は、欠損とは区別して通知
  const showFetchError = !loading && fetchError;

  const renderValue = (
    status: FieldStatus,
    unit: string
  ) => (
    <div className="data-value-group">
      <span className="data-value">
        {status.value !== null
          ? `${status.value}  ${unit}`
          : unit}
      </span>
    </div>
  );

  // 24時間以内の個別メッセージを表示
  const renderStaleMessage = (status: FieldStatus) => {
    if (
      loading ||
      wholePageError ||
      showFetchError ||
      !status.stale ||
      !status.latestDatetime
    ) {
      return null;
    }

    return (
      <div className="stale-message-area">
        <span className="stale-message">
          {formatDateTime(status.latestDatetime)}時点
        </span>
      </div>
    );
  };

  const renderFieldError = (status: FieldStatus) => {
    if (!status.error) return null;

    return (
      <div className="field-error-overlay">
        <span>
          この項目のデータが24時間以上ありません
        </span>
        <span>
          最新のデータ：
          {formatDateTime(status.latestDatetime)}
        </span>
      </div>
    );
  };

  return (
    <PageLayout title="データ">
      <section className="data-page-area">
        {/* 日付と時間 */}
        <section className="date-area">
          <div className="date-icon">
            <Link
              to="/calendar"
              className="calendar-link"
              state={{ selectedDate, time }}
            >
              <Icons.CalendarRange size={30} />
            </Link>
          </div>

          <button
            className="reload-button"
            onClick={() => {
              const now = new Date();
              const latestTime = getLatestTime();

              setSelectedDate(now);
              setTime(latestTime);

              navigate("/data", {
                replace: true,
                state: {
                  selectedDate: now,
                  time: latestTime,
                },
              });
            }}
          >
            <Icons.RefreshCw size={24} />
          </button>

          <div className="date-text-group">
            <span className="date-text">
              {formatDate(selectedDate)}
            </span>
            <br />
            <select
              className="time-select"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              {times.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 気温 */}
        <section className="sensor-data-area">
          <div
            className={`data-row ${outsideStatus.stale && !wholePageError && !showFetchError
              ? "has-stale-message"
              : ""
              }`}
          >
            <span>気温</span>
            {renderValue(outsideStatus, "℃")}
          </div>

          {renderStaleMessage(outsideStatus)}

          {!wholePageError &&
            !showFetchError &&
            renderFieldError(outsideStatus)}
        </section>

        {/* 水温 */}
        <section className="sensor-data-area">
          <div
            className={`data-row ${waterStatus.stale && !wholePageError && !showFetchError
              ? "has-stale-message"
              : ""
              }`}
          >
            <span>水温</span>
            {renderValue(waterStatus, "℃")}
          </div>

          {renderStaleMessage(waterStatus)}

          {!wholePageError &&
            !showFetchError &&
            renderFieldError(waterStatus)}
        </section>

        {/* 塩分濃度 */}
        <section className="sensor-data-area">
          <div
            className={`data-row ${salinityStatus.stale && !wholePageError && !showFetchError
              ? "has-stale-message"
              : ""
              }`}
          >
            <span>塩分濃度</span>
            {renderValue(salinityStatus, "‰")}
          </div>

          {renderStaleMessage(salinityStatus)}

          {!wholePageError &&
            !showFetchError &&
            renderFieldError(salinityStatus)}
        </section>

        {/* 溶存酸素 */}
        <section className="sensor-data-area">
          <div
            className={`data-row ${doStatus.stale && !wholePageError && !showFetchError
                ? "has-stale-message"
                : ""
              }`}
          >
            <div>
              <span>
                溶存酸素{" "}
                <small className="sensor-name">({doSensor})</small>
              </span>
            </div>

            {renderValue(doStatus, "mg/L")}
          </div>

          {renderStaleMessage(doStatus)}

          {!wholePageError &&
            !showFetchError &&
            renderFieldError(doStatus)}
        </section>
      </section>

      {/* 白いデータ一覧部分だけに全体エラーを表示 */}
      {(wholePageError || showFetchError) && (
        <div className="data-area-error-overlay">
          <div className="error-message-card">
            {wholePageError ? (
              <>
                <p>
                  センサデータが24時間以上取得できていません。
                </p>
                <p>
                  最新のデータ：
                  {formatDateTime(
                    latestOverallRecord?.datetime ?? null
                  )}
                </p>
              </>
            ) : (
              <>
                <p>センサデータを取得できませんでした。</p>
                <p>通信状態を確認して、再度お試しください。</p>
              </>
            )}
          </div>
        </div>
      )}

    </PageLayout>
  );
}
