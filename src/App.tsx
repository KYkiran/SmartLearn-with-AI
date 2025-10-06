// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Navigation } from "./components/Navigation";
import LandingPage from "./pages/Landing";  // New landing page
import { DashboardPage } from "./pages/Dashboard";
import { CoursePage } from "./pages/Course";
import { CreateCoursePage } from "./pages/CreateCourse";
import { CoursesPage } from "./pages/Courses";
import { ProfilePage } from "./pages/Profile";
import { AdminPanel } from "./pages/Admin";
import Login from "./pages/Login";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />  {/* Landing page for logged out users */}
              <Route path="/dashboard" element={<DashboardPage />} />  {/* Dashboard for logged in users */}
              <Route path="/login" element={<Login />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CoursePage />} />
              <Route path="/create-course" element={<CreateCoursePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
