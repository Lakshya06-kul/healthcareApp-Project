import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/login", label: "Login" },
  { to: "/register", label: "Register" },
  { to: "/doctor", label: "Doctor Dashboard" },
  { to: "/patient", label: "Patient Dashboard" },
  { to: "/booking", label: "Booking" },
  { to: "/chat", label: "Chat" },
  { to: "/video", label: "Video Call" }
];

export default function AppLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${active
                    ? "bg-cyan-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
