import "./DataPage.css";
import { Icons } from "@/components/materials"; // アイコンのインポート
import PageLayout from "@/components/PageLayout";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // カレンダーへの遷移

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

// 日付の表示フォーマット関数
const formatDate = (date: Date) => {
  const month = date.getMonth() + 1; // 月は0から始まるので+1する
  const day = date.getDate();
  const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]; // 曜日を取得

  return `${month}月${day}日（${week}）`;
};

export default function DataPage() {
  // APIから取得したデータ
  const [outsideTemp, setOutsideTemp] = useState<number | null>(null);
  const [waterTemp, setWaterTemp] = useState<number | null>(null);
  const [salinity, setSalinity] = useState<number | null>(null);
  const [doValue, setDoValue] = useState<number | null>(null);

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

  // 統合センサーAPIからデータを取得
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch(
          "https://sakamoto-sensors-test.vercel.app/api/sensors"
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log("統合APIから取得したデータ:", data);
        console.log("選択中の日時:", selectedDate, time);

        // 選択した日付・時間をDateに変換
        const [hours, minutes] = time.split(":").map(Number);

        const targetDate = new Date(selectedDate);
        targetDate.setHours(hours, minutes, 0, 0);

        const targetTime = targetDate.getTime();

        // 選択日時に最も近いデータを探す
        let targetData = null;
        let nearestDiff = Infinity;

        for (const item of data) {
          const itemTime = new Date(item.datetime).getTime();
          const diff = Math.abs(itemTime - targetTime);

          if (diff < nearestDiff) {
            nearestDiff = diff;
            targetData = item;
          }
        }

        // 5分以上離れている場合はデータなし
        if (!targetData || nearestDiff > 5 * 60 * 1000) {
          console.log("選択日時に近いデータがありません");

          setOutsideTemp(null);
          setWaterTemp(null);
          setSalinity(null);
          setDoValue(null);

          return;
        }

        console.log("選択日時に最も近いデータ:", targetData);

        // 気温
        setOutsideTemp(targetData.outsideTemp);

        // 水温
        setWaterTemp(targetData.waterTemp);

        // 塩分濃度
        setSalinity(targetData.salinity);

        // 溶存酸素
        if (doSensor === "DO01") {
          setDoValue(targetData.oxygen1);
        } else if (doSensor === "DO03") {
          setDoValue(targetData.oxygen3);
        } else {
          setDoValue(null);
        }

      } catch (error) {
        console.error(
          "センサーデータの取得に失敗しました:",
          error
        );

        setOutsideTemp(null);
        setWaterTemp(null);
        setSalinity(null);
        setDoValue(null);
      }
    };

    fetchSensorData();
  }, [selectedDate, time, doSensor]);

  return (
    <PageLayout title="データ">

      <section className="data-page-area">

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

            <span className="date-text">
              {formatDate(selectedDate)}
            </span>

            <br />

            {/* 時間を選択する */}
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
            <span>
              {outsideTemp !== null
                ? `${outsideTemp}  ℃`
                : "  ℃"}
            </span>
          </div>
        </section>

        <section className="sensor-data-area">
          <div className="data-row">
            <span>水温</span>
            <span>
              {waterTemp !== null
                ? `${waterTemp}  ℃`
                : "  ℃"}
            </span>
          </div>
        </section>

        <section className="sensor-data-area">
          <div className="data-row">
            <span>塩分濃度</span>
            <span>
              {salinity !== null
                ? `${salinity}  ‰`
                : "  ‰"}
            </span>
          </div>
        </section>

        <section className="sensor-data-area">
          <div className="data-row">

            <div>
              <span>
                溶存酸素{" "}
                <small className="sensor-name">
                  ({doSensor})
                </small>
              </span>
            </div>

            <span>
              {doValue !== null
                ? `${doValue}  mg/L`
                : "  mg/L"}
            </span>

          </div>
        </section>

      </section>

    </PageLayout>
  );
}