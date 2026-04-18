import { Link, useLocation, useNavigate } from "react-router-dom";

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const doctorLinks = [
    { to: "/doctor", label: "Dashboard" },
    { to: "/chat", label: "Messages" },
    { to: "/video", label: "Video Call" }
  ];

  const patientLinks = [
    { to: "/patient", label: "Dashboard" },
    { to: "/booking", label: "Book" },
    { to: "/chat", label: "Messages" },
    { to: "/video", label: "Video Call" }
  ];

  const links = user?.role === "doctor" ? doctorLinks : patientLinks;
  const showAuthNav = Boolean(token) && !["/login", "/register"].includes(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastAppointmentId");
    localStorage.removeItem("lastAppointmentChannelName");
    navigate("/login");
  };

  return (
    <div className="min-h-screen text-slate-900">
      {showAuthNav && (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">Healthcare Pro</p>
              <h1 className="text-base font-bold text-slate-900">Patient Management Portal</h1>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              {links.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active
                        ? "bg-teal-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </nav>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
