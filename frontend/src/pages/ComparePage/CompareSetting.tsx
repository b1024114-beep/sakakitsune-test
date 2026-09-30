import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompareSetting.css";
import PageLayout from "@/components/PageLayout";

export default function CompareSettingPage() {

  // ナビゲーション
  const navigate = useNavigate();

  // 相関モード
  const [correlationMode, setCorrelationMode] = useState(false);

  // 種類
  const [sensorType, setSensorType] = useState("water");
  const [correlationSensors, setCorrelationSensors] = useState<string[]>([]);

  // グラフ期間
  const [graphPeriod, setGraphPeriod] = useState("month");

  // 比較期間
  const [periods, setPeriods] = useState([
    {
      id: 1,
      color: "#ff6b6b",
      year: 2026,
      month: 5,
      day: 1,
    },
    {
      id: 2,
      color: "#6ba8ff",
      year: 2026,
      month: 6,
      day: 1,
    },
  ]);

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

    const settings = JSON.parse(saved);

    setCorrelationMode(settings.correlationMode);
    setSensorType(settings.sensorType);
    setCorrelationSensors(settings.correlationSensors
      ?? []);
    setGraphPeriod(settings.graphPeriod);
    setPeriods(settings.periods);

  }, []);

  // 期間追加
  const addPeriod = () => {

    if (periods.length >= 5) return;

    const usedColors = periods.map(period => period.color);

    const newColor = colors.find(
      color => !usedColors.includes(color)
    );

    if (!newColor) return;

    const newPeriod = {
      id: Date.now(),
      color: newColor,
      year: 2026,
      month: 7,
      day: 1,
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
            ...period, [key]: value,
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
  const hasDuplicatePeriods = () => {

    const keys = periods.map((period) => {

      switch (graphPeriod) {

        case "year":
          return `${period.year}`;

        case "month":
          return `${period.year}-${period.month}`;

        case "day":
          return `${period.year}-${period.month}-${period.day}`;

        default:
          return "";
      }

    });

    return new Set(keys).size !== keys.length;

  };

  // 相関モードでの種類選択
  const toggleCorrelationSensor = (sensor: string) => {

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
    const settings = {

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

        {/* 種類 */}
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
                    setSensorType(e.target.value)
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
                    setSensorType(e.target.value)
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
                    setSensorType(e.target.value)
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
                    setSensorType(e.target.value)
                  }
                />
                溶存酸素
              </label>

            </div>

            {correlationMode && correlationSensors.length < 2 && (
              <p className="error-message">
                種類が足りません
              </p>
            )}

          </div>
        )}

        {/* 相関モードでの種類選択 */}
        {correlationMode && (

          <div className="setting-section">

            <p className="section-title">種類</p>

            <div className="radio-grid">

              {[
                { value: "air", label: "気温" },
                { value: "water", label: "水温" },
                { value: "salt", label: "塩分濃度" },
                { value: "oxygen", label: "溶存酸素" },
              ].map((sensor) => (

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
                  setGraphPeriod(e.target.value)
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
                  setGraphPeriod(e.target.value)
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
                  setGraphPeriod(e.target.value)
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
                  {Array.from({ length: 11 }, (_, i) => 2026 + i).map((year) => (
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
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
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
                  {Array.from({ length: getDaysInMonth(period.year, period.month) }, (_, i) => i + 1).map((day) => (
                    <option
                      key={day}
                      value={day}
                    >
                      {day}
                    </option>
                  ))}
                </select>

                <span>日</span>

              </div>

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

          {/* 期間を５コまでにするやつ */}
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