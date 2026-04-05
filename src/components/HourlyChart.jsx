import React, { useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from "recharts";

/* Custom tooltip styled to match the active theme */
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "8px 12px",
      fontSize: "12px",
      boxShadow: "0 4px 24px var(--accent-dim)",
    }}>
      <p style={{ color: "var(--muted)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}{p.unit || ""}
        </p>
      ))}
    </div>
  );
}

/* Brush component — reads accent directly from ThemeContext, works in production */
function ChartBrush({ dataLength }) {
  const { themeKey, themes } = useTheme();
  const startIndex = Math.max(0, dataLength - 12);

  const vars = themes[themeKey]?.vars || {};
  const accent = vars["--accent"] || "#22d3ee";
  const bg2    = vars["--bg2"]    || "#0d1526";
  const border = vars["--border"] || "rgba(255,255,255,0.1)";

  return (
    <Brush
      dataKey="hour"
      startIndex={startIndex}
      height={28}
      stroke={accent}
      fill={bg2}
      travellerWidth={8}
      traveller={<CustomTraveller fill={accent} stroke={border} />}
    />
  );
}

/* Custom traveller handle */
function CustomTraveller({ x, y, width, height, fill, stroke }) {
  return (
    <rect
      x={x}
      y={y}
      width={width || 8}
      height={height || 28}
      rx={4}
      ry={4}
      fill={fill}
      stroke={stroke}
      strokeWidth={1}
      style={{ cursor: "ew-resize" }}
    />
  );
}

/* Shared axis and grid styles driven by CSS variables */
const axisTick = { fill: "var(--muted)", fontSize: 11 };
const gridStroke = "var(--grid)";

/* Wraps each chart — horizontal scroll on mobile, drag-to-scroll on desktop */
function ChartWrapper({ title, children }) {
  const scrollRef = useRef(null);

  /* Drag-to-scroll on desktop */
  const onMouseDown = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;
    const startX = e.pageX - el.offsetLeft;
    const scrollLeft = el.scrollLeft;
    const onMove = (e) => { el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX); };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  return (
    <div
      className="rounded-2xl p-4 min-w-0 w-full relative"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      {/* Corner glow blob */}
      <div
        className="liquid-blob-tile absolute -top-6 -right-6 w-24 h-24 opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, var(--card-blob) 0%, transparent 70%)" }}
      />

      {/* Title + zoom hint */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          {title}
        </h3>
        <span className="text-xs hidden sm:block" style={{ color: "var(--muted)", opacity: 0.45 }}>
          drag handles to zoom
        </span>
        <span className="text-xs sm:hidden" style={{ color: "var(--muted)", opacity: 0.45 }}>
          scroll · drag handles to zoom
        </span>
      </div>

      {/* Scrollable container — touch-friendly on mobile, draggable on desktop */}
      <div
        ref={scrollRef}
        className="overflow-x-auto relative z-10"
        style={{ WebkitOverflowScrolling: "touch", cursor: "grab" }}
        onMouseDown={onMouseDown}
      >
        {/* minWidth keeps chart legible on small screens */}
        <div style={{ minWidth: 480 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* Generic hourly area chart with Brush zoom + scroll */
export function HourlyAreaChart({ title, data, dataKey, color, unit }) {
  return (
    <ChartWrapper title={title}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} />
          <Tooltip content={<DarkTooltip />} />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} name={title} unit={unit ? ` ${unit}` : ""} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <ChartBrush dataLength={data.length} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

/* Precipitation bar chart with Brush zoom + scroll */
export function HourlyBarChart({ title, data, dataKey, color, unit }) {
  return (
    <ChartWrapper title={title}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} />
          <Tooltip content={<DarkTooltip />} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} name={title} unit={unit ? ` ${unit}` : ""} />
          <ChartBrush dataLength={data.length} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

/* Combined PM10 + PM2.5 chart with Brush zoom + scroll */
export function PMChart({ data }) {
  return (
    <ChartWrapper title="PM10 & PM2.5 (μg/m³)">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-pm10" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--accent)"  stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--accent)"  stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-pm25" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--accent2)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--accent2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} />
          <Tooltip content={<DarkTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
          <Area type="monotone" dataKey="pm10" stroke="var(--accent)"  strokeWidth={2} fill="url(#grad-pm10)" name="PM10"  unit=" μg/m³" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="pm25" stroke="var(--accent2)" strokeWidth={2} fill="url(#grad-pm25)" name="PM2.5" unit=" μg/m³" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <ChartBrush dataLength={data.length} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
