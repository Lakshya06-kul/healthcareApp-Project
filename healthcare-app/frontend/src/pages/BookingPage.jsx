import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  connectSocket,
  offSlotBooked,
  offSlotUpdated,
  onSlotBooked,
  onSlotUpdated
} from "../socket/socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function BookingPage() {
  const location = useLocation();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctorId: "", date: "", time: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preselectedDoctorId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("doctorId") || "";
  }, [location.search]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor._id) === String(form.doctorId)),
    [doctors, form.doctorId]
  );

  const availableSlots = useMemo(() => {
    if (!form.date) return [];
    return selectedDoctor?.availability?.find((entry) => entry.date === form.date)?.slots || [];
  }, [form.date, selectedDoctor]);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch(`${API_URL}/doctor`);
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.msg || "Failed to load doctors");
          return;
        }

        setDoctors(data.doctors || []);
      } catch (_error) {
        setErrorMessage("Network error while loading doctors.");
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    if (!form.doctorId && doctors.length > 0) {
      const found = doctors.find((doctor) => String(doctor._id) === String(preselectedDoctorId));
      setForm((prev) => ({ ...prev, doctorId: String(found?._id || doctors[0]._id) }));
    }
  }, [doctors, form.doctorId, preselectedDoctorId]);

  useEffect(() => {
    connectSocket();

    const handleSlotUpdated = (payload) => {
      if (!payload?.doctorId || !payload?.date || !Array.isArray(payload.availableSlots)) {
        return;
      }

      setDoctors((prev) =>
        prev.map((doctor) =>
          String(doctor._id) !== String(payload.doctorId)
            ? doctor
            : {
              ...doctor,
              availability: [
                ...(doctor.availability || []).filter((entry) => entry.date !== payload.date),
                { date: payload.date, slots: payload.availableSlots }
              ]
            }
        )
      );

      if (String(payload.doctorId) === String(form.doctorId) && payload.date === form.date) {
        setStatusMessage(`Live update: slots refreshed for ${payload.date}`);
        setErrorMessage("");
      }
    };

    const handleSlotBooked = (payload) => {
      if (!payload?.doctorId || !payload?.date || !payload?.time) {
        return;
      }

      setDoctors((prev) =>
        prev.map((doctor) => {
          if (String(doctor._id) !== String(payload.doctorId)) {
            return doctor;
          }

          return {
            ...doctor,
            availability: (doctor.availability || []).map((entry) =>
              entry.date === payload.date
                ? { ...entry, slots: entry.slots.filter((slot) => slot !== payload.time) }
                : entry
            )
          };
        })
      );

      if (String(payload.doctorId) === String(form.doctorId) && payload.date === form.date) {
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

      if (data?.appointment?._id) {
        localStorage.setItem("lastAppointmentId", data.appointment._id);
      }

      if (data?.appointment?.channelName) {
        localStorage.setItem("lastAppointmentChannelName", data.appointment.channelName);
      }

      setDoctors((prev) =>
        prev.map((doctor) => {
          if (String(doctor._id) !== String(form.doctorId)) {
            return doctor;
          }

          return {
            ...doctor,
            availability: (doctor.availability || []).map((entry) =>
              entry.date === form.date
                ? { ...entry, slots: entry.slots.filter((slot) => slot !== form.time) }
                : entry
            )
          };
        })
      );

      setStatusMessage("Appointment booked successfully.");
      setForm((prev) => ({ ...prev, time: "" }));
    } catch (_error) {
      setErrorMessage("Network error while booking appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
      <h1 className="text-3xl font-bold">Book Appointment</h1>
      <p className="mb-6 text-sm text-slate-600">Choose doctor, date and time for your meeting.</p>

      {doctors.length === 0 && !errorMessage && (
        <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          No doctor profiles are available yet.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <select
          name="doctorId"
          value={form.doctorId}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
          disabled={doctors.length === 0}
        >
          {doctors.map((doctor) => (
            <option key={doctor._id} value={doctor._id}>
              {doctor.userId?.name || "Unnamed doctor"} - Rs. {doctor.price}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
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
                  className={`rounded-lg border px-3 py-1.5 text-sm ${form.time === slot
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-teal-700"
                    }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
          Consultation fee: Rs. {selectedDoctor?.price || "N/A"}
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
          className="w-full rounded-xl bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </section>
  );
}
