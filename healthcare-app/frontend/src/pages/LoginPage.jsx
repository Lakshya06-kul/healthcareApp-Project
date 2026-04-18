import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user?.role === "doctor") {
      navigate("/doctor", { replace: true });
    }

    if (token && user?.role === "patient") {
      navigate("/patient", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.role === "doctor") {
        navigate("/doctor");
      } else {
        navigate("/patient");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-8 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl md:grid-cols-2 md:p-10">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">Healthcare Pro</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-slate-900">Secure Login</h1>
          <p className="mt-3 text-sm text-slate-600">
            Sign in to manage appointments, schedules, chats, and video consultations.
          </p>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50/80 p-4 text-sm text-teal-800">
          Separate dashboards are provided for doctors and patients after login.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-teal-700"
            required
          />

          <label className="block text-sm font-semibold text-slate-700">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-teal-700"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-700 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Do not have an account?{" "}
          <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800">
            Register here
          </Link>
        </p>
      </div>
    </section>
  );
}
