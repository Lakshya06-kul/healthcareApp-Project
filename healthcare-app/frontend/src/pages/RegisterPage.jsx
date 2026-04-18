import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <h1 className="mb-1 text-3xl font-bold text-slate-900">Create Account</h1>
      <p className="mb-6 text-sm text-slate-600">Choose your role and complete registration</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">Full Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full name"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
          required
        />
        <label className="block text-sm font-semibold text-slate-700">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
          required
        />
        <label className="block text-sm font-semibold text-slate-700">Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
          required
        />
        <label className="block text-sm font-semibold text-slate-700">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-700"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
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

      <p className="mt-5 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
          Back to login
        </Link>
      </p>
    </section>
  );
}
