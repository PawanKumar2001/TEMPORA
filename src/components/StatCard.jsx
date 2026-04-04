import React from "react";

/* Each accent variant shifts opacity/tint slightly but always derives
   its core color from the active theme's CSS variables */
const accentMap = {
  cyan:    { opacity: "0.20", bgOpacity: "0.06" },
  amber:   { opacity: "0.25", bgOpacity: "0.08" },
  rose:    { opacity: "0.20", bgOpacity: "0.06" },
  violet:  { opacity: "0.15", bgOpacity: "0.05" },
  emerald: { opacity: "0.18", bgOpacity: "0.06" },
  sky:     { opacity: "0.18", bgOpacity: "0.05" },
  orange:  { opacity: "0.20", bgOpacity: "0.06" },
};

/* Displays a single weather metric — theme-aware tile */
const StatCard = React.memo(function StatCard({ icon, label, value, unit, accent = "amber", sub }) {
  const a = accentMap[accent] || accentMap.amber;

  return (
    <div
      className="relative rounded-2xl p-4 flex flex-col gap-1 overflow-hidden cursor-default"
      style={{
        border: "1px solid var(--accent-border)",
        background: "var(--surface)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 0 20px var(--accent-dim)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Subtle glow blob — always follows theme accent */}
      <div
        className="liquid-blob-tile absolute -bottom-4 -right-4 w-20 h-20 opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, var(--card-blob) 0%, transparent 70%)" }}
      />

      <div
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest relative z-10"
        style={{ color: "var(--accent)", opacity: 0.8 }}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </div>

      <div className="text-2xl font-bold relative z-10" style={{ color: "var(--text)" }}>
        {value ?? "—"}
        {unit && <span className="text-sm font-normal ml-1 opacity-50">{unit}</span>}
      </div>

      {sub && (
        <div className="text-xs relative z-10" style={{ color: "var(--accent)", opacity: 0.6 }}>
          {sub}
        </div>
      )}
    </div>
  );
});

export default StatCard;
