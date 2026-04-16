import { useState } from "react";

const doctors = [
  { id: "d1", name: "Dr. Hamza", specialization: "Cardiology", online: true },
  { id: "d2", name: "Dr. Areeba", specialization: "Dermatology", online: false }
];

export default function PatientDashboardPage() {
  const [query, setQuery] = useState("");

  const filtered = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(query.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Patient Dashboard</h1>
        <p className="text-slate-600">Find doctors and manage bookings</p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search doctor or specialization"
          className="mt-4 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-700"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((doctor) => (
          <article key={doctor.id} className="rounded-2xl bg-white p-5 shadow">
            <h3 className="text-lg font-semibold">{doctor.name}</h3>
            <p className="text-slate-600">{doctor.specialization}</p>
            <p className={`mt-2 text-sm font-medium ${doctor.online ? "text-emerald-600" : "text-slate-500"}`}>
              {doctor.online ? "Online now" : "Offline"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
