import React, { useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
} from "recharts";

/* ── Shared constants ──────────────────────────────────────────────────── */
const axisTick  = { fill: "var(--muted)", fontSize: 10 };
const gridStroke = "var(--grid)";

/* Reduces X-axis labels for dense date ranges — shows every Nth label */
function tickFormatter(value, total) {
  return (i) => (i % Math.ceil(total / 10) === 0 ? value : "");
}

/* ── Tooltip ───────────────────────────────────────────────────────────── */

function HistTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "8px 12px",
      fontSize: "12px",
      boxShadow: "0 4px 24px var(--accent-dim)",
      maxWidth: 220,
    }}>
      <p style={{ color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.stroke, fontWeight: 500 }}>
          {p.name}: <strong>{p.value ?? "—"}</strong>{p.unit || ""}
        </p>
      ))}
    </div>
  );
}

/* ── Brush ─────────────────────────────────────────────────────────────── */

/* Brush defaults to showing last 90 days — reads from ThemeContext for production safety */
function HistBrush({ dataLength }) {
  const { themeKey, themes } = useTheme();
  const startIndex = Math.max(0, dataLength - 90);

  const vars   = themes[themeKey]?.vars || {};
  const accent = vars["--accent"] || "#22d3ee";
  const bg2    = vars["--bg2"]    || "#0d1526";
  const border = vars["--border"] || "rgba(255,255,255,0.1)";

  return (
    <Brush
      dataKey="date"
      startIndex={startIndex}
      height={26}
      stroke={accent}
      fill={bg2}
      travellerWidth={7}
      traveller={<HistTraveller fill={accent} stroke={border} />}
    />
  );
}

/* Custom traveller handle for HistBrush */
function HistTraveller({ x, y, width, height, fill, stroke }) {
  return (
    <rect
      x={x}
      y={y}
      width={width || 7}
      height={height || 26}
      rx={3}
      ry={3}
      fill={fill}
      stroke={stroke}
      strokeWidth={1}
      style={{ cursor: "ew-resize" }}
    />
  );
}

/* ── Chart Wrapper ─────────────────────────────────────────────────────── */

/* Horizontal-scroll + drag-to-scroll wrapper shared by all historical charts */
function HistChartWrapper({ title, subtitle, children, dataLength = 0 }) {
  const scrollRef = useRef(null);

  /* Drag-to-scroll on desktop */
  const onMouseDown = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;
    const startX    = e.pageX - el.offsetLeft;
    const scrollLeft = el.scrollLeft;
    const onMove = (e) => { el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX); };
    const onUp   = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  /* Dynamic minWidth: wider for longer ranges so labels stay legible */
  const minWidth = Math.max(520, dataLength * 3);

  return (
    <div
      className="rounded-2xl p-4 w-full relative"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      {/* Corner glow */}
      <div
        className="liquid-blob-tile absolute -top-6 -right-6 w-28 h-28 opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, var(--card-blob) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 relative z-10 gap-1">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)", opacity: 0.5 }}>{subtitle}</p>
          )}
        </div>
        <span className="text-xs" style={{ color: "var(--muted)", opacity: 0.4 }}>
          drag handles · scroll to explore
        </span>
      </div>

      {/* Scrollable chart area */}
      <div
        ref={scrollRef}
        className="overflow-x-auto relative z-10"
        style={{ WebkitOverflowScrolling: "touch", cursor: "grab" }}
        onMouseDown={onMouseDown}
      >
        <div style={{ minWidth }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Temperature Chart ─────────────────────────────────────────────────── */

/* Line chart: Mean, Max, Min temperature over a date range */
export function TempHistChart({ data }) {
  return (
    <HistChartWrapper title="Temperature Trends" subtitle="Mean · Max · Min (°C)" dataLength={data.length}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} unit="°" />
          <Tooltip content={<HistTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
          <Line type="monotone" dataKey="tempMean" stroke="var(--accent)"  strokeWidth={2} dot={false} name="Mean"  unit="°C" activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="tempMax"  stroke="var(--accent2)" strokeWidth={1.5} dot={false} name="Max" unit="°C" strokeDasharray="4 2" activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="tempMin"  stroke="var(--muted)"   strokeWidth={1.5} dot={false} name="Min" unit="°C" strokeDasharray="4 2" activeDot={{ r: 3 }} />
          <HistBrush dataLength={data.length} />
        </LineChart>
      </ResponsiveContainer>
    </HistChartWrapper>
  );
}

/* ── Sun Cycle Chart ───────────────────────────────────────────────────── */

/* Area chart: Sunrise and Sunset times in IST (decimal hours) */
export function SunCycleChart({ data }) {
  return (
    <HistChartWrapper title="Sun Cycle" subtitle="Sunrise & Sunset (IST)" dataLength={data.length}>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-daylight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={40}
            /* Convert decimal hour back to HH:MM for Y-axis labels */
            tickFormatter={(v) => {
              if (v == null) return "";
              const h = Math.floor(v);
              const m = Math.round((v - h) * 60);
              return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
            }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              /* Format decimal hour to HH:MM for tooltip */
              const fmt = (v) => {
                if (v == null) return "—";
                const h = Math.floor(v);
                const m = Math.round((v - h) * 60);
                return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
              };
              return (
                <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, padding:"8px 12px", fontSize:12 }}>
                  <p style={{ color:"var(--muted)", marginBottom:4 }}>{label}</p>
                  {payload.map((p,i) => (
                    <p key={i} style={{ color: p.color, fontWeight:600 }}>{p.name}: {fmt(p.value)}</p>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
          {/* Filled area between sunrise and sunset represents daylight hours */}
          <Area type="monotone" dataKey="sunset"  stroke="var(--accent)"  strokeWidth={2} fill="url(#grad-daylight)" name="Sunset"  dot={false} />
          <Line type="monotone" dataKey="sunrise" stroke="var(--accent2)" strokeWidth={2} dot={false} name="Sunrise" />
          <HistBrush dataLength={data.length} />
        </ComposedChart>
      </ResponsiveContainer>
    </HistChartWrapper>
  );
}

/* ── Precipitation Chart ───────────────────────────────────────────────── */

/* Bar chart: total daily precipitation over the range */
export function PrecipHistChart({ data }) {
  return (
    <HistChartWrapper title="Precipitation" subtitle="Daily total (mm)" dataLength={data.length}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} unit="mm" />
          <Tooltip content={<HistTooltip />} />
          <Bar dataKey="precipitation" fill="var(--accent)" radius={[3, 3, 0, 0]} name="Precipitation" unit=" mm" maxBarSize={8} />
          <HistBrush dataLength={data.length} />
        </BarChart>
      </ResponsiveContainer>
    </HistChartWrapper>
  );
}

/* ── Wind Chart ────────────────────────────────────────────────────────── */

/* Composed chart: bar for wind speed + line for dominant direction */
export function WindHistChart({ data }) {
  return (
    <HistChartWrapper title="Wind" subtitle="Max Speed (km/h) · Dominant Direction (°)" dataLength={data.length}>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          {/* Left Y: wind speed */}
          <YAxis yAxisId="speed" tick={axisTick} tickLine={false} axisLine={false} width={36} unit=" km/h" />
          {/* Right Y: wind direction degrees */}
          <YAxis yAxisId="dir" orientation="right" tick={axisTick} tickLine={false} axisLine={false} width={36} unit="°" domain={[0, 360]} />
          <Tooltip content={<HistTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
          <Bar yAxisId="speed" dataKey="windSpeed" fill="var(--accent)" radius={[3,3,0,0]} name="Max Speed" unit=" km/h" maxBarSize={8} opacity={0.8} />
          <Line yAxisId="dir" type="monotone" dataKey="windDir" stroke="var(--accent2)" strokeWidth={1.5} dot={false} name="Direction" unit="°" />
          <HistBrush dataLength={data.length} />
        </ComposedChart>
      </ResponsiveContainer>
    </HistChartWrapper>
  );
}

/* ── Air Quality Chart ─────────────────────────────────────────────────── */

/* Line chart: PM10 and PM2.5 daily trends */
export function AQHistChart({ data }) {
  return (
    <HistChartWrapper title="Air Quality Trends" subtitle="PM10 & PM2.5 (μg/m³)" dataLength={data.length}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={40} unit=" μg" />
          <Tooltip content={<HistTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
          {/* WHO guideline reference lines */}
          <ReferenceLine y={15} stroke="var(--accent2)"  strokeDasharray="4 3" label={{ value: "WHO PM10", fill: "var(--muted)", fontSize: 9 }} />
          <ReferenceLine y={5}  stroke="var(--accent)"   strokeDasharray="4 3" label={{ value: "WHO PM2.5", fill: "var(--muted)", fontSize: 9 }} />
          <Line type="monotone" dataKey="pm10" stroke="var(--accent)"  strokeWidth={2} dot={false} name="PM10"  unit=" μg/m³" activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="pm25" stroke="var(--accent2)" strokeWidth={2} dot={false} name="PM2.5" unit=" μg/m³" activeDot={{ r: 4 }} />
          <HistBrush dataLength={data.length} />
        </LineChart>
      </ResponsiveContainer>
    </HistChartWrapper>
  );
}
