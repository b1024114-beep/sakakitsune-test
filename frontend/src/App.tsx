import { Routes, Route, Navigate } from "react-router-dom";

import DataPage from "./pages/DataPage/DataPage";
import GraphPage from "./pages/GraphPage/GraphPage";
import ComparePage from "./pages/ComparePage/ComparePage";
import SettingsPage from "./pages/SettingPage/SettingPage";
import CalendarPage from "./pages/DataPage/Calendar";//カレンダー
import CompareSettingPage from "./pages/ComparePage/CompareSetting"

import BottomNavigation from "./components/BottomNavigation";

//画面遷移の設定
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/data" replace />} />
        
        <Route path="/data" element={<DataPage />} />
        {/* カレンダーへの遷移 */}
        <Route path="/calendar" element={<CalendarPage />} />

        <Route path="/graph" element={<GraphPage />} />
        <Route path="/compare" element={<ComparePage />} />

        {/* 比較設定画面への遷移 */}
        <Route path="/compare-setting" element={<CompareSettingPage />}/>
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      <BottomNavigation />
    </>
  );
}

export default App;