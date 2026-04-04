import { useState, useMemo } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useLocationName } from "../hooks/useLocationName";
import { useHistoricalWeather } from "../hooks/useHistoricalWeather";
import { SkeletonChart } from "../components/Skeleton";
import {
  TempHistChart,
  SunCycleChart,
  PrecipHistChart,
  WindHistChart,
  AQHistChart,
} from "../components/HistoricalChart";

/* ── Date helpers ──────────────────────────────────────────────────────── */

/* Returns YYYY-MM-DD string for today */
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/* Returns YYYY-MM-DD string for 30 days ago */
function defaultStartStr() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

/* Returns the minimum allowed start date (2 years before end date) */
function minStartFor(endDate) {
  const d = new Date(endDate);
  d.setFullYear(d.getFullYear() - 2);
  return d.toISOString().split("T")[0];
}

/* Formats a date range summary string */
function rangeSummary(start, end) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end   + "T00:00:00");
  const days = Math.round((e - s) / 86400000) + 1;
  return `${days} day${days !== 1 ? "s" : ""} selected`;
}

/* Converts IST sunrise/sunset string "HH:MM" to decimal hours for charting */
function timeToDecimal(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split("T")[1]?.split(":") || timeStr.split(":");
  if (!parts || parts.length < 2) return null;
  return parseInt(parts[0]) + parseInt(parts[1]) / 60;
}

/* ── Stat Summary Card ─────────────────────────────────────────────────── */

/* Small summary card shown above charts */
function SummaryCard({ label, value, unit, icon }) {
  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-col gap-0.5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color: "var(--text)" }}>
        {value ?? "—"}
        {unit && <span className="text-xs font-normal ml-1 opacity-50">{unit}</span>}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */

export default function HistoricalWeather() {
  const [startDate, setStartDate] = useState(defaultStartStr);
  const [endDate,   setEndDate]   = useState(todayStr);

  const { location, loading: gpsLoading, error: gpsError, usingFallback, retry } = useGeolocation();
  const locationName = useLocationName(location);
  const { data, loading, error } = useHistoricalWeather(location, startDate, endDate);

  /* Clamp start date when end date changes */
  function handleEndChange(val) {
    setEndDate(val);
    if (startDate < minStartFor(val)) setStartDate(minStartFor(val));
  }

  /* Build flat daily data array from API responses */
  const dailyData = useMemo(() => {
    const wd = data?.weather?.daily;
    const aq = data?.airQuality?.daily;
    if (!wd?.time) return [];

    return wd.time.map((date, i) => ({
      /* Format date as MMM DD for compact axis labels */
      date: new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tempMean:      wd.temperature_2m_mean?.[i]             ?? null,
      tempMax:       wd.temperature_2m_max?.[i]              ?? null,
      tempMin:       wd.temperature_2m_min?.[i]              ?? null,
      sunrise:       timeToDecimal(wd.sunrise?.[i])          ?? null,
      sunset:        timeToDecimal(wd.sunset?.[i])           ?? null,
      precipitation: wd.precipitation_sum?.[i]               ?? null,
      windSpeed:     wd.wind_speed_10m_max?.[i]              ?? null,
      windDir:       wd.wind_direction_10m_dominant?.[i]     ?? null,
      pm10:          aq?.pm10?.[i]                           ?? null,
      pm25:          aq?.pm2_5?.[i]                          ?? null,
    }));
  }, [data]);

  /* Compute summary stats across the selected range */
  const stats = useMemo(() => {
    if (!dailyData.length) return {};
    const temps  = dailyData.map(d => d.tempMean).filter(v => v != null);
    const precip = dailyData.map(d => d.precipitation).filter(v => v != null);
    const wind   = dailyData.map(d => d.windSpeed).filter(v => v != null);
    return {
      avgTemp:    temps.length  ? (temps.reduce((a,b) => a+b,0) / temps.length).toFixed(1)  : null,
      totalPrecip: precip.length ? precip.reduce((a,b) => a+b,0).toFixed(1)                 : null,
      maxWind:    wind.length   ? Math.max(...wind).toFixed(1)                               : null,
      days:       dailyData.length,
    };
  }, [dailyData]);

  if (gpsLoading && !location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>Detecting your location…</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 overflow-x-hidden">

      {/* ── Fallback location banner ── */}
      {usingFallback && gpsError && (
        <div
          className="rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}
        >
          <div className="flex items-start gap-2">
            <span>📍</span>
            <p className="text-xs" style={{ color: "var(--text)" }}>{gpsError}</p>
          </div>
          <button
            onClick={retry}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
          {gpsLoading ? <span style={{ opacity: 0.3 }}>Detecting location…</span> : locationName || "Historical Weather"}
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Long-term historical analysis · up to 2 years
        </p>
      </div>

      {/* ── Date Range Picker ── */}
      <div
        className="rounded-2xl p-4 sm:p-5 relative overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {/* Decorative glow */}
        <div
          className="blob-drift absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none opacity-10"
          style={{ background: "radial-gradient(ellipse, var(--accent) 0%, transparent 65%)" }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Start date */}
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                From
              </label>
              <input
                type="date"
                value={startDate}
                min={minStartFor(endDate)}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl px-4 py-2 text-sm focus:outline-none cursor-pointer w-full"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
                onFocus={e  => e.target.style.borderColor = "var(--accent)"}
                onBlur={e   => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {/* End date */}
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                To
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={todayStr()}
                onChange={(e) => handleEndChange(e.target.value)}
                className="rounded-xl px-4 py-2 text-sm focus:outline-none cursor-pointer w-full"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
                onFocus={e  => e.target.style.borderColor = "var(--accent)"}
                onBlur={e   => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          </div>

          {/* Range summary badge */}
          <div
            className="rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap self-end sm:self-auto"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
          >
            {rangeSummary(startDate, endDate)}
          </div>
        </div>

        {/* Quick range shortcuts */}
        <div className="flex flex-wrap gap-2 mt-4 relative z-10">
          {[
            { label: "7D",  days: 7   },
            { label: "30D", days: 30  },
            { label: "3M",  days: 90  },
            { label: "6M",  days: 180 },
            { label: "1Y",  days: 365 },
            { label: "2Y",  days: 730 },
          ].map(({ label, days }) => {
            /* Highlight the active shortcut */
            const start = new Date();
            start.setDate(start.getDate() - days);
            const startStr = start.toISOString().split("T")[0];
            const isActive = startDate === startStr && endDate === todayStr();

            return (
              <button
                key={label}
                onClick={() => { setStartDate(startStr); setEndDate(todayStr()); }}
                className="rounded-lg px-3 py-1 text-xs font-bold transition-all"
                style={{
                  background: isActive ? "var(--accent-dim)" : "var(--bg)",
                  border: `1px solid ${isActive ? "var(--accent-border)" : "var(--border)"}`,
                  color: isActive ? "var(--accent)" : "var(--muted)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Summary Stats Row ── */}
      {!loading && dailyData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard icon="🌡" label="Avg Temp"       value={stats.avgTemp}     unit="°C" />
          <SummaryCard icon="🌧" label="Total Precip"   value={stats.totalPrecip} unit="mm" />
          <SummaryCard icon="💨" label="Peak Wind"      value={stats.maxWind}     unit="km/h" />
          <SummaryCard icon="📅" label="Days Analyzed"  value={stats.days}        unit="days" />
        </div>
      )}

      {/* ── Charts ── */}
      {error && (
        <div className="rounded-2xl p-6 text-center" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>⚠️ Failed to load historical data. {error}</p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          /* Skeleton placeholders while data loads */
          Array(5).fill(0).map((_, i) => <SkeletonChart key={i} />)
        ) : dailyData.length > 0 ? (
          <>
            <TempHistChart   data={dailyData} />
            <SunCycleChart   data={dailyData} />
            <PrecipHistChart data={dailyData} />
            <WindHistChart   data={dailyData} />
            <AQHistChart     data={dailyData} />
          </>
        ) : !loading && !error ? (
          <div className="rounded-2xl p-10 text-center" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Select a date range above to load historical data.</p>
          </div>
        ) : null}
      </div>

    </main>
  );
}
