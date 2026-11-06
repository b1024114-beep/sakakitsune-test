import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ComparePage.css";
import PageLayout from "@/components/PageLayout";
import CompareChart from "./CompareChart";
import CompareScatter from "./CompareScatter";
import type { CompareSettings } from "./compareData";

export default function ComparePage() {

const [settings, setSettings] = useState<CompareSettings | null>(null);

  // 保存された設定を読み込む
  useEffect(() => {
    const saved = localStorage.getItem("compareSettings");
    if (!saved) return;

    try {
      setSettings(JSON.parse(saved));
    } catch {
      localStorage.removeItem("compareSettings");
    }

  }, []);

   // 種類表示
  const getSensorName = () => {
    if (!settings) return "";

    const names: { [key: string]: string } = {
      air: "気温",
      water: "水温",
      salt: "塩分濃度",
      oxygen: "溶存酸素",
    };

    // 相関モード
    if (settings.correlationMode) {
      return settings.correlationSensors
        .map((sensor) => names[sensor])
        .join(" ✖ ");
    }

    // 通常モード
    return names[settings.sensorType];
  };
// DOセンサーの表示名
const DO_NAMES = {
  oxygen1: "DO1",
  oxygen2: "DO2",
  oxygen3: "DO3",
};

// 期間表示（溶存酸素のときは DO センサー名も付ける）
const getPeriodText = (period: CompareSettings["periods"][number]) => {
  if (!settings) return "";

  const month = String(period.month).padStart(2, "0");
  const day = String(period.day).padStart(2, "0");

  const dateText =
    settings.graphPeriod === "year"
      ? `${period.year}`
      : settings.graphPeriod === "month"
        ? `${period.year}/${month}`
        : `${period.year}/${month}/${day}`;

        const usesOxygen = settings.correlationMode
    ? settings.correlationSensors.includes("oxygen")
    : settings.sensorType === "oxygen";

  if (usesOxygen) {
    return `${dateText} (${DO_NAMES[period.oxygenSensor ?? "oxygen1"]})`;
  }

  return dateText;
};
  return (

    <PageLayout title="比較">

      <section className="compare-header">

        {/* 上段 */}
        <div className="compare-top">

          {/* 種類 */}
          <div className="compare-type">

            <span className="compare-title">
              種類
            </span>

            <div className="sensor-box">
              {settings
                ? getSensorName()
                : "-"}
            </div>
          </div>

          <Link
            to="/compare-setting"
            className="setting-button"
          >
            設定
          </Link>
        </div>

        {/* 下段*/}
        <div className="compare-period">

          {settings?.periods.map((period) => (

            <div
              key={period.id}
              className="period-tag"
              style={{
                backgroundColor: period.color,
              }}
            >
              {getPeriodText(period)}
              

            </div>

          ))}

        </div>

      </section>


      {/* グラフ表示エリア */}
      <section className="compare-area">

        {/* 相関モード OFF */}
        {settings && !settings.correlationMode && (
          <CompareChart settings={settings} />
        )}

        {/* 相関モード ON */}
        {settings && settings.correlationMode && (
          <CompareScatter settings={settings} />
        )}

      </section>

    </PageLayout>

  );

}