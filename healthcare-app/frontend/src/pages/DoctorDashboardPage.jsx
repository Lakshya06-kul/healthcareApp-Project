import { useState } from "react";

const initialAppointments = [
  { id: "A-101", patient: "Ali Khan", date: "2026-04-18", time: "10:00", status: "booked" },
  { id: "A-102", patient: "Sara Noor", date: "2026-04-18", time: "11:00", status: "booked" }
];

export default function DoctorDashboardPage() {
  const [appointments] = useState(initialAppointments);
  const [isOnline, setIsOnline] = useState(false);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <p className="text-slate-600">Manage your availability and appointments</p>

        <button
          onClick={() => setIsOnline((prev) => !prev)}
          className={`mt-4 rounded-lg px-4 py-2 font-medium text-white ${isOnline ? "bg-emerald-600" : "bg-slate-700"
            }`}
        >
          {isOnline ? "Online" : "Offline"}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Upcoming Appointments</h2>
        <div className="space-y-3">
          {appointments.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium">{item.patient}</p>
              <p className="text-sm text-slate-600">
                {item.date} at {item.time} • {item.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
