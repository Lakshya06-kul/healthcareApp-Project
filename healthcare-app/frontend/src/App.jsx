import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DoctorDashboardPage from "./pages/DoctorDashboardPage";
import PatientDashboardPage from "./pages/PatientDashboardPage";
import BookingPage from "./pages/BookingPage";
import ChatPage from "./pages/ChatPage";
import VideoCallPage from "./pages/VideoCallPage";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/doctor" element={<DoctorDashboardPage />} />
        <Route path="/patient" element={<PatientDashboardPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/video" element={<VideoCallPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppLayout>
  );
}
