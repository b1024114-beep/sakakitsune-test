
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompareSetting.css";
import PageLayout from "@/components/PageLayout";
import type { CompareSettings, SensorKey } from "./compareData";

export default function CompareSettingPage() {

  // ナビゲーション
  const navigate = useNavigate();

  // 相関モード
  const [correlationMode, setCorrelationMode] = useState<boolean>(false);

  // 種類
  const [sensorType, setSensorType] = useState<SensorKey>("water");
  const [correlationSensors, setCorrelationSensors] = useState<SensorKey[]>([]);

  // グラフ期間
  const [graphPeriod, setGraphPeriod] =
    useState<CompareSettings["graphPeriod"]>("month");

  // 比較期間：初期状態では0件
  const [periods, setPeriods] =
    useState<CompareSettings["periods"]>([]);

  // 期間の色
  const colors = [
    "#ff6b6b",
    "#6ba8ff",
    "#63d471",
    "#f7c948",
    "#b56eff",
  ];

  // 初回のみ保存データを読み込む
  useEffect(() => {

    const saved = localStorage.getItem("compareSettings");

    if (!saved) return;

    try {
      const settings: CompareSettings = JSON.parse(saved);

      setCorrelationMode(settings.correlationMode);
      setSensorType(settings.sensorType);
      setCorrelationSensors(settings.correlationSensors ?? []);
      setGraphPeriod(settings.graphPeriod);
      setPeriods(settings.periods);
    } catch {
      localStorage.removeItem("compareSettings");
    }

  }, []);

  // 期間追加
  const addPeriod = () => {

    // 5件を超えて追加しない
    if (periods.length >= 5) return;

    // 使用されていない色を取得
    const usedColors = periods.map(period => period.color);

    const newColor = colors.find(
      color => !usedColors.includes(color)
    );

    if (!newColor) return;

    // 現在の日付を取得
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // グラフ期間に応じた初期値を設定
    const newPeriod = {
      id: Date.now(),
      color: newColor,
      year: currentYear,
      month: graphPeriod === "year" ? 1 : currentMonth,
      day: currentDay,
       oxygenSensor: "oxygen1" as const,
    };

    setPeriods(prev => [...prev, newPeriod]);

  };

  // 期間削除
  const deletePeriod = (id: number) => {

    setPeriods(prev =>
      prev.filter(period => period.id !== id)
    );

  };

  // 日付変更
  const updatePeriodDate = (
    id: number,
    key: "year" | "month" | "day",
    value: number
  ) => {

    setPeriods(prev =>
      prev.map(period =>
        period.id === id
          ? {
              ...period,
              [key]: value,
              day:
                key === "year" || key === "month"
                  ? Math.min(
                      period.day,
                      getDaysInMonth(
                        key === "year" ? value : period.year,
                        key === "month" ? value : period.month
                      )
                    )
                  : value,
            }
          : period
      )
    );

  };

  // 月の日数を取得する関数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 重複期間の判定
  // 重複期間の判定
const hasDuplicatePeriods = () => {
  const usesOxygen = correlationMode
    ? correlationSensors.includes("oxygen")
    : sensorType === "oxygen";

  const keys = periods.map((period) => {
    let dateKey = "";

    switch (graphPeriod) {
      case "year":
        dateKey = `${period.year}`;
        break;

      case "month":
        dateKey = `${period.year}-${period.month}`;
        break;

      case "day":
        dateKey = `${period.year}-${period.month}-${period.day}`;
        break;
    }

    // 溶存酸素を使用する場合は日付とDO番号で判定
    if (usesOxygen) {
      const oxygenSensor = period.oxygenSensor ?? "oxygen1";
      return `${dateKey}-${oxygenSensor}`;
    }

    return dateKey;
  });

  return new Set(keys).size !== keys.length;
};

  // 相関モードでの種類選択
  const toggleCorrelationSensor = (sensor: SensorKey) => {

    // 既に選択されている場合
    if (correlationSensors.includes(sensor)) {

      setCorrelationSensors(prev =>
        prev.filter(item => item !== sensor)
      );

      return;
    }

    // 2個以上は追加しない
    if (correlationSensors.length >= 2) return;

    setCorrelationSensors(prev => [...prev, sensor]);

  };
  // DOセンサー選択欄を表示するか判定
const showOxygenSelector = correlationMode
  ? correlationSensors.includes("oxygen")
  : sensorType === "oxygen";

  // 設定保存
  const saveSettings = () => {

    // 相関モードでの種類不足のエラーメッセージ
    if (
      correlationMode &&
      correlationSensors.length < 2
    ) {
      alert("種類を2つ選択してください。");
      return;
    }

    // 期間が設定されていない場合のエラーメッセージ
    if (periods.length === 0) {
      alert("期間が設定されていません。");
      return;
    }

    // 期間が重複している場合のエラーメッセージ
    if (hasDuplicatePeriods()) {
      alert("期間が重複しています。");
      return;
    }

    // 設定を保存
    const settings: CompareSettings = {
      correlationMode,
      sensorType,
      correlationSensors,
      graphPeriod,
      periods,
    };

    // localStorageに保存
    localStorage.setItem(
      "compareSettings",
      JSON.stringify(settings)
    );

    navigate("/compare");

  };

  return (
    <PageLayout
      title="比較設定"
      showBackButton={true}
      className="compare-setting-page"
    >
      {/* 設定エリア */}
      <section className="compare-setting-area">

        {/* 相関モード */}
        <div className="setting-row">
          <label>相関モード</label>

          <label className="switch">
            <input
              type="checkbox"
              checked={correlationMode}
              onChange={(e) =>
                setCorrelationMode(e.target.checked)
              }
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* 通常モードでの種類選択 */}
        {!correlationMode && (
          <div className="setting-section">

            <p className="section-title">種類</p>

            <div className="radio-grid">

              <label>
                <input
                  type="radio"
                  name="sensor"
                  value="air"
                  checked={sensorType === "air"}
                  onChange={(e) =>
                    setSensorType(e.target.value as SensorKey)
                  }
                />
                気温
              </label>

              <label>
                <input
                  type="radio"
                  name="sensor"
                  value="water"
                  checked={sensorType === "water"}
                  onChange={(e) =>
                    setSensorType(e.target.value as SensorKey)
                  }
                />
                水温
              </label>

              <label>
                <input
                  type="radio"
                  name="sensor"
                  value="salt"
                  checked={sensorType === "salt"}
                  onChange={(e) =>
                    setSensorType(e.target.value as SensorKey)
                  }
                />
                塩分濃度
              </label>

              <label>
                <input
                  type="radio"
                  name="sensor"
                  value="oxygen"
                  checked={sensorType === "oxygen"}
                  onChange={(e) =>
                    setSensorType(e.target.value as SensorKey)
                  }
                />
                溶存酸素
              </label>

            </div>

          </div>
        )}

        {/* 相関モードでの種類選択 */}
        {correlationMode && (
          <div className="setting-section">

            <p className="section-title">種類</p>

            <div className="radio-grid">

              {(
                [
                  { value: "air", label: "気温" },
                  { value: "water", label: "水温" },
                  { value: "salt", label: "塩分濃度" },
                  { value: "oxygen", label: "溶存酸素" },
                ] satisfies { value: SensorKey; label: string }[]
              ).map((sensor) => (

                <label key={sensor.value}>

                  <input
                    type="checkbox"
                    checked={correlationSensors.includes(sensor.value)}
                    onChange={() =>
                      toggleCorrelationSensor(sensor.value)
                    }
                    disabled={
                      correlationSensors.length >= 2 &&
                      !correlationSensors.includes(sensor.value)
                    }
                  />

                  {sensor.label}

                </label>

              ))}

            </div>

          </div>
        )}

        <hr className="setting-divider" />

        {/* グラフ期間 */}
        <div className="setting-section">

          <p className="section-title">グラフ期間</p>

          <div className="period-radio">

            <label>
              <input
                type="radio"
                name="period"
                value="day"
                checked={graphPeriod === "day"}
                onChange={(e) =>
                  setGraphPeriod(
                    e.target.value as CompareSettings["graphPeriod"]
                  )
                }
              />
              日
            </label>

            <label>
              <input
                type="radio"
                name="period"
                value="month"
                checked={graphPeriod === "month"}
                onChange={(e) =>
                  setGraphPeriod(
                    e.target.value as CompareSettings["graphPeriod"]
                  )
                }
              />
              月
            </label>

            <label>
              <input
                type="radio"
                name="period"
                value="year"
                checked={graphPeriod === "year"}
                onChange={(e) =>
                  setGraphPeriod(
                    e.target.value as CompareSettings["graphPeriod"]
                  )
                }
              />
              年
            </label>

          </div>

        </div>

        <hr className="setting-divider" />

        {/* 期間 */}
        <div className="setting-section">

          <p className="section-title">期間</p>

          {periods.map((period) => (

            <div
              className="period-card"
              key={period.id}
            >

              <div
                className="period-color"
                style={{
                  backgroundColor: period.color,
                }}
              />

              <div className="period-select-area">

                {/* 年 */}
                <select
                  value={period.year}
                  onChange={(e) =>
                    updatePeriodDate(
                      period.id,
                      "year",
                      Number(e.target.value)
                    )
                  }
                >
                  {Array.from(
                    { length: 11 },
                    (_, i) => 2026 + i
                  ).map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  ))}
                </select>

                <span>年</span>

                {/* 月 */}
                <select
                  value={period.month}
                  disabled={graphPeriod === "year"}
                  onChange={(e) =>
                    updatePeriodDate(
                      period.id,
                      "month",
                      Number(e.target.value)
                    )
                  }
                >
                  {Array.from(
                    { length: 12 },
                    (_, i) => i + 1
                  ).map((month) => (
                    <option
                      key={month}
                      value={month}
                    >
                      {month}
                    </option>
                  ))}
                </select>

                <span>月</span>

                {/* 日 */}
                <select
                  value={period.day}
                  disabled={
                    graphPeriod === "year" ||
                    graphPeriod === "month"
                  }
                  onChange={(e) =>
                    updatePeriodDate(
                      period.id,
                      "day",
                      Number(e.target.value)
                    )
                  }
                >
                  {Array.from(
                    {
                      length: getDaysInMonth(
                        period.year,
                        period.month
                      ),
                    },
                    (_, i) => i + 1
                  ).map((day) => (
                    <option
                      key={day}
                      value={day}
                    >
                      {day}
                    </option>
                  ))}
                </select>

                <span>日</span>

                {/* 溶存酸素センサー */}
{showOxygenSelector && (
  <div className="oxygen-select">
    <select
      value={period.oxygenSensor ?? "oxygen1"}
      onChange={(e) => {
        const oxygenSensor = e.target.value as
          | "oxygen1"
          | "oxygen2"
          | "oxygen3";

        setPeriods((prev) =>
          prev.map((item) =>
            item.id === period.id
              ? { ...item, oxygenSensor }
              : item
          )
        );
      }}
    >
      <option value="oxygen1">DO01</option>
      <option value="oxygen2">DO02</option>
      <option value="oxygen3">DO03</option>
    </select>
  </div>
)}

              </div>

              {/* 削除ボタン */}
              <button
                className="delete-button"
                onClick={() =>
                  deletePeriod(period.id)
                }
              >
                ×
              </button>

            </div>

          ))}

          {/* 期間追加ボタン */}
          {periods.length < 5 && (
            <button
              className="add-period-button"
              onClick={addPeriod}
            >
              ＋ 期間を追加
            </button>
          )}

        </div>

        {/* OKボタン */}
        <div className="ok-button-area">

          <button
            className="ok-button"
            onClick={saveSettings}
          >
            OK
          </button>

        </div>

      </section>

    </PageLayout>
  );
}
