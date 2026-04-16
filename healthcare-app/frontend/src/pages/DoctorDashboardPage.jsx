import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const defaultProfileForm = {
  specialization: "",
  price: ""
};

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [profileForm, setProfileForm] = useState(defaultProfileForm);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [availabilitySlots, setAvailabilitySlots] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const refreshDashboard = async () => {
    if (!token) {
      setError("Login required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [doctorRes, appointmentRes] = await Promise.all([
        fetch(`${API_URL}/doctor/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/appointments/my`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const doctorData = await doctorRes.json();
      const appointmentData = await appointmentRes.json();

      if (doctorRes.ok && doctorData?.doctor) {
        setDoctorProfile(doctorData.doctor);
        setProfileForm({
          specialization: doctorData.doctor.specialization || "",
          price: doctorData.doctor.price || ""
        });
      } else {
        setDoctorProfile(null);
      }

      if (appointmentRes.ok) {
        setAppointments(appointmentData.appointments || []);
      }
    } catch (_err) {
      setError("Could not load doctor dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const stats = useMemo(() => {
    const total = appointments.length;
    const booked = appointments.filter((a) => a.status === "booked").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    return { total, booked, completed };
  }, [appointments]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/doctor/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          specialization: profileForm.specialization,
          price: Number(profileForm.price)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.msg || "Could not save profile");
        return;
      }

      setDoctorProfile(data.doctor);
      setMessage("Doctor profile saved.");
    } catch (_err) {
      setError("Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const updateOnlineStatus = async () => {
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/doctor/toggle`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.msg || "Could not update online status");
        return;
      }

      setDoctorProfile((prev) => (prev ? { ...prev, isOnline: data.isOnline } : prev));
      setMessage(data.isOnline ? "You are now online" : "You are now offline");
    } catch (_err) {
      setError("Network error while updating status.");
    }
  };

  const addAvailability = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const parsedSlots = availabilitySlots
      .split(",")
      .map((slot) => slot.trim())
      .filter(Boolean);

    if (!availabilityDate || parsedSlots.length === 0) {
      setError("Provide date and at least one slot (comma separated).");
      return;
    }

    const existing = doctorProfile?.availability || [];
    const withoutDate = existing.filter((item) => item.date !== availabilityDate);
    const currentDateSlots = existing.find((item) => item.date === availabilityDate)?.slots || [];
    const mergedSlots = [...new Set([...currentDateSlots, ...parsedSlots])];

    const payload = [...withoutDate, { date: availabilityDate, slots: mergedSlots }];

    try {
      const response = await fetch(`${API_URL}/doctor/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ availability: payload })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.msg || "Could not update availability");
        return;
      }

      setDoctorProfile((prev) => (prev ? { ...prev, availability: data.availability || [] } : prev));
      setAvailabilityDate("");
      setAvailabilitySlots("");
      setMessage("Availability updated.");
    } catch (_err) {
      setError("Network error while updating availability.");
    }
  };

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
        setError(data.msg || "Could not update appointment status");
        return;
      }

      setAppointments((prev) =>
        prev.map((item) =>
          String(item._id) === String(appointmentId) ? { ...item, status: data.appointment.status } : item
        )
      );
      setMessage("Appointment status updated.");
    } catch (_err) {
      setError("Network error while updating appointment.");
    }
  };

  if (loading) {
    return <p className="rounded-2xl bg-white p-6 shadow">Loading doctor dashboard...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Manage profile, availability, consultations, and patient meetings.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm text-slate-500">Total Appointments</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm text-slate-500">Booked</p>
            <p className="text-2xl font-bold">{stats.booked}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Doctor Profile</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">Set your specialization and consultation price.</p>

          <input
            value={profileForm.specialization}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, specialization: e.target.value }))}
            placeholder="Specialization"
            className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
            required
          />

          <input
            type="number"
            min="0"
            value={profileForm.price}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="Consultation price"
            className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
            required
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>

            <button
              type="button"
              onClick={updateOnlineStatus}
              className={`rounded-xl px-4 py-2 font-semibold text-white ${doctorProfile?.isOnline ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-700 hover:bg-slate-800"}`}
            >
              {doctorProfile?.isOnline ? "Set Offline" : "Set Online"}
            </button>
          </div>
        </form>

        <form onSubmit={addAvailability} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Availability Scheduler</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">Add online/offline time slots for patient booking.</p>

          <input
            type="date"
            value={availabilityDate}
            onChange={(e) => setAvailabilityDate(e.target.value)}
            className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
            required
          />

          <input
            value={availabilitySlots}
            onChange={(e) => setAvailabilitySlots(e.target.value)}
            placeholder="Slots e.g. 10:00, 11:00, 15:30"
            className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
            required
          />

          <button className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800">
            Save Availability
          </button>
        </form>
      </div>

      {(message || error) && (
        <div className="space-y-2">
          {message && <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
          {error && <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Upcoming Meetings</h2>

        {appointments.length === 0 && <p className="text-sm text-slate-600">No appointments yet.</p>}

        <div className="space-y-3">
          {appointments.map((item) => (
            <article key={item._id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Patient: {item.patientId?.name || "Unknown"}</p>
                  <p className="text-sm text-slate-600">{item.date} at {item.time} • {item.status}</p>
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
                    Video Call
                  </button>
                  {item.status === "booked" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateAppointmentStatus(item._id, "completed")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Mark Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAppointmentStatus(item._id, "cancelled")}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
                      >
                        Cancel
                      </button>
                    </>
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
