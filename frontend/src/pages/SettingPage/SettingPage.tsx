import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import "./SettingPage.css";

export default function SettingPage() {
  
   /*現在選択されている値を保存*/
  const [doSensor, setDoSensor] = useState("DO01");
  const [temperature, setTemperature] = useState("10.0");
  const [salinity, setSalinity] = useState("25");
  const [oxygen, setOxygen] = useState("0");

  /*ページを開いたとき、localStorageから読み込む*/
  useEffect(() => {
    const savedDosensor = localStorage.getItem("doSensor");
    const savedTemperature = localStorage.getItem("temperature");
    const savedSalinity = localStorage.getItem("salinity");
    const savedOxygen = localStorage.getItem("oxygen");
    if (savedDosensor) {
      setDoSensor(savedDosensor);
    }
    if (savedTemperature) {
      setTemperature(savedTemperature);
    }
    if (savedSalinity) {
      setSalinity(savedSalinity);
    }
    if (savedOxygen) {
      setOxygen(savedOxygen);
    }
  }, []);

  /* 保存ボタン*/
  const handleSave = () => {
    localStorage.setItem("doSensor", doSensor);
    localStorage.setItem("temperature", temperature);
    localStorage.setItem("salinity", salinity);
    localStorage.setItem("oxygen", oxygen);
    alert("設定を保存しました");
  };

  
  return (
    <PageLayout title="設定">
      <div className="setting-page-container">
        {/* DOセンサ */}
        <div className="setting-row">
          <label>DOセンサ</label>
          <select
              value={doSensor}
              onChange={(e) => setDoSensor(e.target.value)}
          >
            <option>DO01</option>
            <option>DO02</option>
            <option>DO03</option>
          </select>
        </div>

        {/* ★ここに横線を追加 */}
        <hr className="setting-divider" />

        {/* 適正値設定 */}
        <h2 className="setting-title">適正値設定</h2>
        
        {/* 水温 */}
        <div className="setting-row">
          <label>水温</label>
          <select
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
          >
            {/* 選択肢数指定 */}
            {Array.from({ length: 41 }, (_, i) => {
              // 0.5刻みで 10.0℃から30.0℃までの値を生成(小数点第一位まで表示)
              const value = (10 + i * 0.5).toFixed(1);
              return (
              <option key={value} value={value}>
                {value}℃
                </option>
                );
                })}
          </select>
        </div>

        {/* 塩分濃度 */}
        <div className="setting-row">
          <label>塩分濃度</label>
          <select
              value={salinity}
              onChange={(e) => setSalinity(e.target.value)}
          >
            {Array.from({ length: 11 }, (_, i) => {
              const value = 25 + i;
              return (
              <option key={value} value={value}>
                {value}‰
                </option>
                );
                })}
          </select>
        </div>

        {/* 溶存酸素 */}
        <div className="setting-row">
          <label>溶存酸素</label>
          <select
              value={oxygen}
              onChange={(e) => setOxygen(e.target.value)}
          >
            {Array.from({ length: 21 }, (_, i) => (
              <option key={i} value={i}>
                {i}mg/L
                </option>
              ))}
          </select>
        </div>

        {/* 保存ボタン */}
        <div className="save-button-area">
         <button 
             className="save-button"
             onClick={handleSave}
         >
           保存
         </button>
        </div>

      </div>
    </PageLayout>
  );
}