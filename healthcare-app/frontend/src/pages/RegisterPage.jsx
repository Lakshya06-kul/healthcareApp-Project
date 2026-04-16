import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || "Registration failed");
        return;
      }

      setSuccess("Registration successful. Redirecting to login...");
      setForm({ name: "", email: "", password: "", role: "patient" });

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Register</h1>
      <p className="mb-6 text-sm text-slate-600">Create a doctor or patient account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-700"
          required
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-700"
          required
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-700"
          required
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-700"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {success && (
          <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        )}
      </form>
    </section>
  );
}
