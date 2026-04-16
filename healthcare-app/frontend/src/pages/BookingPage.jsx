import { useEffect, useMemo, useState } from "react";
import {
  connectSocket,
  offSlotBooked,
  offSlotUpdated,
  onSlotBooked,
  onSlotUpdated
} from "../socket/socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const doctors = [
  { id: "doc001", name: "Dr. Hamza", fee: 1200 },
  { id: "doc002", name: "Dr. Areeba", fee: 1500 }
];

const initialAvailability = {
  doc001: {
    "2026-04-20": ["10:00", "11:00", "12:00"],
    "2026-04-21": ["09:00", "10:30"]
  },
  doc002: {
    "2026-04-20": ["13:00", "14:00"],
    "2026-04-21": ["15:00", "16:00"]
  }
};

export default function BookingPage() {
  const [form, setForm] = useState({ doctorId: doctors[0].id, date: "", time: "" });
  const [availability, setAvailability] = useState(initialAvailability);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === form.doctorId),
    [form.doctorId]
  );

  const availableSlots = useMemo(() => {
    if (!form.date) return [];
    return availability[form.doctorId]?.[form.date] || [];
  }, [availability, form.date, form.doctorId]);

  useEffect(() => {
    connectSocket();

    const handleSlotUpdated = (payload) => {
      if (!payload?.doctorId || !payload?.date || !Array.isArray(payload.availableSlots)) {
        return;
      }

      setAvailability((prev) => ({
        ...prev,
        [payload.doctorId]: {
          ...(prev[payload.doctorId] || {}),
          [payload.date]: payload.availableSlots
        }
      }));

      if (payload.doctorId === form.doctorId && payload.date === form.date) {
        setStatusMessage(`Live update: slots refreshed for ${payload.date}`);
        setErrorMessage("");
      }
    };

    const handleSlotBooked = (payload) => {
      if (!payload?.doctorId || !payload?.date || !payload?.time) {
        return;
      }

      setAvailability((prev) => {
        const existingSlots = prev[payload.doctorId]?.[payload.date] || [];
        if (existingSlots.length === 0) return prev;

        return {
          ...prev,
          [payload.doctorId]: {
            ...(prev[payload.doctorId] || {}),
            [payload.date]: existingSlots.filter((slot) => slot !== payload.time)
          }
        };
      });

      if (payload.doctorId === form.doctorId && payload.date === form.date) {
        setStatusMessage(`Slot ${payload.time} was booked by another user.`);
        if (form.time === payload.time) {
          setForm((prev) => ({ ...prev, time: "" }));
        }
      }
    };

    onSlotUpdated(handleSlotUpdated);
    onSlotBooked(handleSlotBooked);

    return () => {
      offSlotUpdated(handleSlotUpdated);
      offSlotBooked(handleSlotBooked);
    };
  }, [form.date, form.doctorId, form.time]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setErrorMessage("");
    setStatusMessage("");

    if (name === "doctorId") {
      setForm((prev) => ({ ...prev, doctorId: value, time: "" }));
      return;
    }

    if (name === "date") {
      setForm((prev) => ({ ...prev, date: value, time: "" }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!form.time) {
      setErrorMessage("Please select an available time slot.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Login required. No token found in localStorage.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_URL}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: form.doctorId,
          date: form.date,
          time: form.time
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.msg || "Booking failed");
        return;
      }

      setAvailability((prev) => {
        const existingSlots = prev[form.doctorId]?.[form.date] || [];
        return {
          ...prev,
          [form.doctorId]: {
            ...(prev[form.doctorId] || {}),
            [form.date]: existingSlots.filter((slot) => slot !== form.time)
          }
        };
      });

      setStatusMessage("Appointment booked successfully.");
      setForm((prev) => ({ ...prev, time: "" }));
    } catch (error) {
      setErrorMessage("Network error while booking appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">Booking Page</h1>
      <p className="mb-6 text-slate-600">Choose doctor, date and time</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <select
          name="doctorId"
          value={form.doctorId}
          onChange={onChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-700"
        >
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={onChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-700"
          required
        />

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Available slots</p>
          {!form.date && <p className="text-sm text-slate-500">Select a date to view slots.</p>}

          {form.date && availableSlots.length === 0 && (
            <p className="text-sm text-red-600">No slots available for this date.</p>
          )}

          {availableSlots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, time: slot }))}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    form.time === slot
                      ? "border-cyan-700 bg-cyan-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-cyan-700"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
          Consultation fee: Rs. {selectedDoctor?.fee}
        </div>

        {statusMessage && (
          <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {statusMessage}
          </p>
        )}

        {errorMessage && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !form.date || !form.time}
          className="w-full rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </section>
  );
}
