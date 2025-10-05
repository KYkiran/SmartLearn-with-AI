import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation.tsx";
import { CoursesPage } from "./pages/Courses";
import { CoursePage } from "./pages/Course";
import { CreateCoursePage } from "./pages/CreateCourse";
import { DashboardPage } from "./pages/Dashboard";
import { ProfilePage } from "./pages/Profile";
import { AdminPanel } from "./pages/Admin";
// ... (import other pages as needed)

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CoursePage />} />
        <Route path="/create-course" element={<CreateCoursePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        {/* More routes: login, register, create-quiz, leaderboard, etc. */}
      </Routes>
    </BrowserRouter>
  );
}
