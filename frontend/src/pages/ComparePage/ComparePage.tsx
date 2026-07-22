import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ComparePage.css";
import PageLayout from "@/components/PageLayout";

export default function ComparePage() {

  const [settings, setSettings] = useState<any>(null);

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
        .map((sensor: string) => names[sensor])
        .join(" ✖ ");
    }

    // 通常モード
    return names[settings.sensorType];
  };

  // 期間表示
  const getPeriodText = (period: any) => {

    if (!settings) return "";
    switch (settings.graphPeriod) {
      case "year":
        return `${period.year}`;
      case "month":
        return `${period.year}/${String(period.month).padStart(2, "0")}`;
      case "day":
        return `${period.year}/${String(period.month).padStart(2, "0")}/${String(period.day).padStart(2, "0")}`;
      default:
        return "";
    }
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

          {settings?.periods.map((period: any) => (

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

      {/* グラフ表示エリア（後で実装） */}
      <section className="compare-area">

      </section>

    </PageLayout>

  );

}