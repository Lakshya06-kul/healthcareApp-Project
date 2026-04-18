import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import AgoraCallMVP from "../components/AgoraCallMVP";

export default function VideoCallPage() {
  const location = useLocation();
  const appointmentId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("appointmentId") || localStorage.getItem("lastAppointmentId") || "";
  }, [location.search]);

  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const uid = user?._id || "";

  const appId = useMemo(() => import.meta.env.VITE_AGORA_APP_ID || "", []);
  const token = useMemo(() => import.meta.env.VITE_AGORA_TOKEN || null, []);

  if (!appointmentId || !uid) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-2 text-2xl font-bold">Video Call Page</h1>
        <p className="text-sm text-slate-600">Open this page from a booked appointment while signed in.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <h1 className="mb-2 text-2xl font-bold">Video Call Page</h1>
      <p className="mb-6 text-sm text-slate-600">
        MVP video call screen powered by Agora. Replace demo values with real appointment/user data.
      </p>

      <AgoraCallMVP appId={appId} token={token} appointmentId={appointmentId} uid={uid} />
    </section>
  );
}
