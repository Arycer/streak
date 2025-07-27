import { Route, Routes } from "react-router-dom";

import WeekPage from "./pages/week";

import IndexPage from "@/pages/index";
import TodayPage from "@/pages/today";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import SummaryPage from "@/pages/summary";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<SummaryPage />} path="/summary" />
      <Route element={<WeekPage />} path="/week" />
      <Route element={<TodayPage />} path="/today" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
    </Routes>
  );
}

export default App;
