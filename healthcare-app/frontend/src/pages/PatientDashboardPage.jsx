import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function PatientDashboardPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [doctorRes, appointmentRes] = await Promise.all([
          fetch(`${API_URL}/doctor`),
          fetch(`${API_URL}/appointments/my`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const doctorData = await doctorRes.json();
        const appointmentData = await appointmentRes.json();

        if (!doctorRes.ok) {
          setError(doctorData.msg || "Could not load doctors");
        } else {
          setDoctors(doctorData.doctors || []);
        }

        if (appointmentRes.ok) {
          setAppointments(appointmentData.appointments || []);
        }
      } catch (_err) {
        setError("Could not load patient dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const filteredDoctors = useMemo(() => {
    if (!query.trim()) return doctors;

    return doctors.filter((doctor) => {
      const name = doctor.userId?.name || "";
      const specialization = doctor.specialization || "";
      return (
        name.toLowerCase().includes(query.toLowerCase()) ||
        specialization.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [doctors, query]);

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const response = await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.msg || "Could not update appointment");
        return;
      }

      setAppointments((prev) =>
        prev.map((item) =>
          String(item._id) === String(appointmentId) ? { ...item, status: data.appointment.status } : item
        )
      );
    } catch (_err) {
      setError("Network error while updating appointment.");
    }
  };

  if (loading) {
    return <p className="rounded-2xl bg-white p-6 shadow">Loading patient dashboard...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Find doctors, compare prices, book appointments, and join meetings.</p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by doctor name or specialization"
          className="mt-4 w-full max-w-xl rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
        />
      </div>

      {error && <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Available Doctors</h2>
          <button
            type="button"
            onClick={() => navigate("/booking")}
            className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Open Booking Page
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <article key={doctor._id} className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-lg font-semibold">{doctor.userId?.name || "Unnamed doctor"}</h3>
              <p className="text-sm text-slate-600">{doctor.specialization || "General"}</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">Consultation: Rs. {doctor.price}</p>
              <p className={`mt-1 text-sm font-semibold ${doctor.isOnline ? "text-emerald-600" : "text-slate-500"}`}>
                {doctor.isOnline ? "Available online" : "Currently offline"}
              </p>

              <button
                type="button"
                onClick={() => navigate(`/booking?doctorId=${doctor._id}`)}
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Book Appointment
              </button>
            </article>
          ))}

          {filteredDoctors.length === 0 && <p className="text-sm text-slate-600">No doctors found.</p>}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">My Meetings</h2>

        {appointments.length === 0 && <p className="text-sm text-slate-600">No appointments booked yet.</p>}

        <div className="space-y-3">
          {appointments.map((item) => (
            <article key={item._id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Doctor: {item.doctorId?.userId?.name || "Unknown"}</p>
                  <p className="text-sm text-slate-600">{item.date} at {item.time} • {item.status}</p>
                  <p className="text-sm text-slate-600">Price: Rs. {item.doctorId?.price || "N/A"}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/chat?appointmentId=${item._id}`)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/video?appointmentId=${item._id}`)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Video
                  </button>
                  {item.status === "booked" && (
                    <button
                      type="button"
                      onClick={() => updateAppointmentStatus(item._id, "cancelled")}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
