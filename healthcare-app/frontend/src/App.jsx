import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DoctorDashboardPage = lazy(() => import("./pages/DoctorDashboardPage"));
const PatientDashboardPage = lazy(() => import("./pages/PatientDashboardPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const VideoCallPage = lazy(() => import("./pages/VideoCallPage"));

export default function App() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="rounded-2xl bg-white p-6 shadow">Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
            <Route path="/doctor" element={<DoctorDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
            <Route path="/patient" element={<PatientDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/video" element={<VideoCallPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}
