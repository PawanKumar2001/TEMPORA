import { NavLink } from "react-router-dom";

/* Fixed navbar — mimics Short.ly style: bold brand left, pill buttons right */
export default function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 z-50 border-b"
      style={{
        width: "100vw",
        background: "var(--bg-glass)",
        borderColor: "var(--border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="w-full px-6 sm:px-10 py-3 sm:py-4 flex items-center justify-between min-w-0">
        <span
          className="text-xl sm:text-2xl font-black tracking-tight shrink-0"
          style={{ color: "var(--text)" }}
        >
          TEMPORA
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {[
            { label: "Current", to: "/" },
            { label: "History", to: "/history" },
          ].map(({ label, to }) => (
            <NavLink key={label} to={to} end={to === "/"}>
              {({ isActive }) => (
                <span
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap"
                  style={
                    isActive
                      ? {
                          background: "var(--text)",
                          color: "var(--bg)",
                        }
                      : {
                          background: "transparent",
                          color: "var(--muted)",
                          border: "1px solid var(--border)",
                        }
                  }
                >
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </div>

      </div>
    </nav>
  );
}
