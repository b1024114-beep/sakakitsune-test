import "./DataPage.css";
import { Icons } from "@/components/materials";//アイコンのインポート
import PageLayout from "@/components/PageLayout";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";//カレンダーへの遷移

// 時間を30分刻みの配列で定義
const times = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

// 現在時刻から最新の30分単位の時間を取得
const getLatestTime = () => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = now.getMinutes();

  // 30分単位で切り捨て
  const roundedMinute = minute < 30 ? "00" : "30";

  return `${hour}:${roundedMinute}`;
};

//日付の表示フォーマット関数
const formatDate = (date: Date) => {
  const month = date.getMonth() + 1; // 月は0から始まるので+1する
  const day = date.getDate();
  const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]; // 曜日を取得

  return `${month}月${day}日（${week}）`;
};

export default function DataPage() {
  // calendarPageから日付、時間を受け取る
  const location = useLocation();
  const navigate = useNavigate();
  const [doSensor, setDoSensor] = useState("DO01");
  useEffect(() => {
  const savedDoSensor = localStorage.getItem("doSensor");

  if (savedDoSensor) {
    setDoSensor(savedDoSensor);
  }
}, []);
  // 選択された日付を管理
  const [selectedDate, setSelectedDate] = useState(
    location.state?.selectedDate
      ? new Date(location.state.selectedDate)
      : new Date()
  );

  // 表示する時間を管理
  const [time, setTime] = useState(
    location.state?.time ?? getLatestTime()
  );

  return (
    <PageLayout title="データ">

      {/* 日付と時間を表示 */}
      <section className="date-area">
        <div className="date-icon">
          {/* カレンダーアイコンの挿入 */}
          <Link
            to="/calendar"
            className="calendar-link"
            state={{
              selectedDate,
              time,
            }}
          >
            <Icons.CalendarRange size={30} />
          </Link>
        </div>

        {/* リロードボタン */}
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
          <span className="date-text">{formatDate(selectedDate)}</span>
          <br />
          {/* 追加　時間を選択する */}
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

      {/* センサから取得したデータを表示 */}
      <section className="sensor-data-area">
        <div className="data-row">
          <span>気温</span>
          <span>℃</span>
        </div>
      </section>

      <section className="sensor-data-area">
        <div className="data-row">
          <span>水温</span>
          <span>℃</span>
        </div>
      </section>

      <section className="sensor-data-area">
        <div className="data-row">
          <span>塩分濃度</span>
          <span>‰</span>
        </div>
      </section>

      <section className="sensor-data-area">
  <div className="data-row">
    <div>
      <span>溶存酸素 <small className="sensor-name">({doSensor})</small></span>
    </div>

    <span>mg/L</span>
  </div>
</section>

    </PageLayout>
  );
}