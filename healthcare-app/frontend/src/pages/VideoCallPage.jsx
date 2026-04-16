import { useMemo } from "react";
import AgoraCallMVP from "../components/AgoraCallMVP";

export default function VideoCallPage() {
  const appointmentId = "appointment-demo-101";
  const uid = "user-demo-1";

  const appId = useMemo(() => import.meta.env.VITE_AGORA_APP_ID || "", []);
  const token = useMemo(() => import.meta.env.VITE_AGORA_TOKEN || null, []);

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
