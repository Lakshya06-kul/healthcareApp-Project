import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && (!user?.role || !allowedRoles.includes(user.role))) {
    return <Navigate to={user?.role === "doctor" ? "/doctor" : "/patient"} replace />;
  }

  return <Outlet />;
}