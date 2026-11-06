import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Calendar from "react-calendar";
// react-calendar の基本スタイルと、カスタムスタイルのインポート
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";

import PageLayout from "@/components/PageLayout";

export default function CalendarPage() {

  // ページ遷移用
  const navigate = useNavigate();
  //locationを定義
  const location = useLocation();
  const time = location.state?.time;
  // データ画面から送られてきたselectedDateを呼び出し初期値にする（データ画面と同じやり方）
  const [selectedDate, setSelectedDate] = useState(
    location.state?.selectedDate
      ? new Date(location.state.selectedDate)
      : new Date()
  );

  // カレンダーで選択した日付を更新
  const handleDateChange = (date: any) => {
    setSelectedDate(date);
    // ここで選択された日付に対応するデータを読み込む処理を呼び出せます
    console.log("選択された日付:", date.toLocaleDateString());


  };

  return (
    <PageLayout title="日付選択" showBackButton={true}>

      {/* カレンダー表示エリア */}
      <section className="calendar-area">

        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          locale="ja-JP"
          formatDay={(_, date) => date.getDate().toString()} //日消去
          maxDate={new Date()}   // 今日より未来は選択不可
        />

        <button className="ok-button" onClick={() =>
          navigate("/data", {
            state: {
              selectedDate,
              time,
            },
          })
        }
        >
          OK
        </button>
      </section>

    </PageLayout>
  );
}