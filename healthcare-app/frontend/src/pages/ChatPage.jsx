import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import ChatBox from "../components/ChatBox";

export default function ChatPage() {
  const location = useLocation();

  const appointmentId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("appointmentId") || localStorage.getItem("lastAppointmentId") || "";
  }, [location.search]);

  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

  if (!appointmentId) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="mt-2 text-slate-600">Open a booked appointment to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ChatBox appointmentId={appointmentId} senderId={user?._id || ""} />
    </div>
  );
}
