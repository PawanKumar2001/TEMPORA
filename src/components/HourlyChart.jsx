import React, { useRef, useCallback, useState } from "react";
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
} from "recharts";

/* ── Tooltip ─────────────────────────────────────────────────────────── */
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

/* ── Custom HTML Range Slider ────────────────────────────────────────── */
/* Replaces Recharts <Brush /> entirely — works in all environments     */
function RangeSelector({ total, startIndex, endIndex, onChange, accent }) {
  const startPct = total > 1 ? (startIndex / (total - 1)) * 100 : 0;
  const endPct   = total > 1 ? (endIndex   / (total - 1)) * 100 : 100;

  return (
    <div className="relative mx-1 mt-2 mb-1" style={{ height: 28 }}>
      {/* Track background */}
      <div className="absolute inset-0 rounded-full" style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        top: "50%", transform: "translateY(-50%)", height: 6,
      }} />

      {/* Active range highlight */}
      <div className="absolute rounded-full" style={{
        background: accent,
        opacity: 0.35,
        left: `${startPct}%`,
        width: `${endPct - startPct}%`,
        top: "50%", transform: "translateY(-50%)", height: 6,
      }} />

      {/* Start handle */}
      <input
        type="range"
        min={0}
        max={total - 1}
        value={startIndex}
        onChange={e => {
          const v = parseInt(e.target.value);
          if (v < endIndex) onChange(v, endIndex);
        }}
        className="absolute w-full appearance-none bg-transparent pointer-events-none"
        style={{ top: "50%", transform: "translateY(-50%)", height: 6,
          "--thumb-color": accent,
        }}
      />

      {/* End handle */}
      <input
        type="range"
        min={0}
        max={total - 1}
        value={endIndex}
        onChange={e => {
          const v = parseInt(e.target.value);
          if (v > startIndex) onChange(startIndex, v);
        }}
        className="absolute w-full appearance-none bg-transparent pointer-events-none"
        style={{ top: "50%", transform: "translateY(-50%)", height: 6,
          "--thumb-color": accent,
        }}
      />

      {/* Range labels */}
      <div className="absolute w-full flex justify-between" style={{ top: 20 }}>
        <span style={{ fontSize: 9, color: accent, opacity: 0.7, marginLeft: `${startPct}%` }}>
          {startIndex}h
        </span>
        <span style={{ fontSize: 9, color: accent, opacity: 0.7, marginRight: `${100 - endPct}%` }}>
          {endIndex}h
        </span>
      </div>
    </div>
  );
}

/* ── Shared constants ─────────────────────────────────────────────── */
const axisTick  = { fill: "var(--muted)", fontSize: 11 };
const gridStroke = "var(--grid)";

/* ── Chart Wrapper ────────────────────────────────────────────────── */
function ChartWrapper({ title, data, children }) {
  const { themeKey, themes } = useTheme();
  const accent = themes[themeKey]?.vars["--accent"] || "#22d3ee";

  const total = data?.length || 0;
  const [range, setRange] = useState(() => ({
    start: Math.max(0, total - 12),
    end: total - 1,
  }));

  /* Reset range when data changes (e.g. date change) */
  const prevTotal = useRef(total);
  if (prevTotal.current !== total) {
    prevTotal.current = total;
    range.start = Math.max(0, total - 12);
    range.end   = total - 1;
  }

  const slicedData = total > 0 ? data.slice(range.start, range.end + 1) : data;

  const scrollRef = useRef(null);
  const onMouseDown = useCallback((e) => {
    const el = scrollRef.current; if (!el) return;
    const startX = e.pageX - el.offsetLeft, scrollLeft = el.scrollLeft;
    const onMove = (e) => { el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX); };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, []);

  return (
    <div className="rounded-2xl p-4 min-w-0 w-full relative"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="liquid-blob-tile absolute -top-6 -right-6 w-24 h-24 opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, var(--card-blob) 0%, transparent 70%)" }} />

      {/* Title */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          {title}
        </h3>
        <span className="text-xs" style={{ color: "var(--muted)", opacity: 0.45 }}>
          slide to zoom
        </span>
      </div>

      {/* Range slider */}
      {total > 1 && (
        <div className="relative z-10 px-1 mb-2">
          <RangeSelector
            total={total}
            startIndex={range.start}
            endIndex={range.end}
            onChange={(s, e) => setRange({ start: s, end: e })}
            accent={accent}
          />
        </div>
      )}

      {/* Scrollable chart */}
      <div ref={scrollRef} className="overflow-x-auto relative z-10"
        style={{ WebkitOverflowScrolling: "touch", cursor: "grab" }}
        onMouseDown={onMouseDown}>
        <div style={{ minWidth: 480, paddingBottom: 8 }}>
          {typeof children === "function" ? children(slicedData, accent) : children}
        </div>
      </div>
    </div>
  );
}

/* ── Area Chart ───────────────────────────────────────────────────── */
export function HourlyAreaChart({ title, data, dataKey, color, unit }) {
  return (
    <ChartWrapper title={title} data={data}>
      {(sliced, accent) => {
        const c = color === "var(--accent)" ? accent : color;
        return (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sliced} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={c} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey={dataKey} stroke={c} strokeWidth={2}
                fill={`url(#grad-${dataKey})`} name={title} unit={unit ? ` ${unit}` : ""}
                dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        );
      }}
    </ChartWrapper>
  );
}

/* ── Bar Chart ────────────────────────────────────────────────────── */
export function HourlyBarChart({ title, data, dataKey, color, unit }) {
  return (
    <ChartWrapper title={title} data={data}>
      {(sliced, accent) => {
        const c = color === "var(--accent)" ? accent : color;
        return (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sliced} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey={dataKey} fill={c} radius={[4, 4, 0, 0]}
                name={title} unit={unit ? ` ${unit}` : ""} />
            </BarChart>
          </ResponsiveContainer>
        );
      }}
    </ChartWrapper>
  );
}

/* ── PM Chart ─────────────────────────────────────────────────────── */
export function PMChart({ data }) {
  return (
    <ChartWrapper title="PM10 & PM2.5 (μg/m³)" data={data}>
      {(sliced, accent) => {
        const { themeKey, themes } = { themeKey: null, themes: null };
        /* accent is already resolved from ChartWrapper */
        const accent2 = accent; /* fallback — will be overridden below */
        return <PMInner sliced={sliced} />;
      }}
    </ChartWrapper>
  );
}

/* Inner component so we can call useTheme cleanly */
function PMInner({ sliced }) {
  const { themeKey, themes } = useTheme();
  const accent  = themes[themeKey]?.vars["--accent"]  || "#22d3ee";
  const accent2 = themes[themeKey]?.vars["--accent2"] || "#38bdf8";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={sliced} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-pm10" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={accent}  stopOpacity={0.35} />
            <stop offset="95%" stopColor={accent}  stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-pm25" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={accent2} stopOpacity={0.35} />
            <stop offset="95%" stopColor={accent2} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="hour" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<DarkTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted)" }} />
        <Area type="monotone" dataKey="pm10" stroke={accent}  strokeWidth={2} fill="url(#grad-pm10)" name="PM10"  unit=" μg/m³" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Area type="monotone" dataKey="pm25" stroke={accent2} strokeWidth={2} fill="url(#grad-pm25)" name="PM2.5" unit=" μg/m³" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
