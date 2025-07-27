import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import BlogPage from "@/pages/week.tsx";
import SummaryPage from "@/pages/summary.tsx";
import WeekPage from "@/pages/week.tsx";
import TodayPage from "@/pages/today.tsx";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<SummaryPage />} path="/summary" />
      <Route element={<WeekPage />} path="/week" />
      <Route element={<TodayPage />} path="/today" />
      <Route element={<BlogPage />} path="/blog" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
    </Routes>
  );
}

export default App;
