import { useState, useMemo, useCallback } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useWeather } from "../hooks/useWeather";
import { useLocationName } from "../hooks/useLocationName";
import StatCard from "../components/StatCard";
import { HourlyAreaChart, HourlyBarChart, PMChart } from "../components/HourlyChart";
import { SkeletonCard, SkeletonChart } from "../components/Skeleton";
import { AQIBadge, aqiLabel } from "../components/AQIBadge";

/* Returns today's date string in YYYY-MM-DD format */
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/* Converts Celsius to Fahrenheit */
function toF(c) {
  if (c == null) return null;
  return ((c * 9) / 5 + 32).toFixed(1);
}

/* Formats an ISO datetime string to just HH:00 */
function fmtHour(iso) {
  return iso ? iso.slice(11, 16) : "";
}

/* Formats a sunrise/sunset ISO string to 12-hour time */
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function CurrentWeather() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [isCelsius, setIsCelsius] = useState(true);

  const { location, loading: gpsLoading, error: gpsError, usingFallback, retry } = useGeolocation();
  const locationName = useLocationName(location);
  const { data, loading: weatherLoading, error: weatherError } = useWeather(location, selectedDate);

  const loading = gpsLoading || weatherLoading;

  /* Pull daily summary values from the weather API response */
  const daily = useMemo(() => {
    if (!data?.weather?.daily) return {};
    const d = data.weather.daily;
    return {
      tempMax: d.temperature_2m_max?.[0],
      tempMin: d.temperature_2m_min?.[0],
      sunrise: d.sunrise?.[0],
      sunset: d.sunset?.[0],
      uvIndex: d.uv_index_max?.[0],
      precipitation: d.precipitation_sum?.[0],
      windSpeedMax: d.wind_speed_10m_max?.[0],
      precipProbMax: d.precipitation_probability_max?.[0],
      humidity: d.relative_humidity_2m_max?.[0],
    };
  }, [data]);

  /* Pull current conditions from the weather API response */
  const current = useMemo(() => {
    if (!data?.weather?.current) return {};
    const c = data.weather.current;
    return {
      temp: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      uvIndex: c.uv_index,
      windSpeed: c.wind_speed_10m,
    };
  }, [data]);

  /* Pull current air quality readings */
  const currentAQ = useMemo(() => {
    if (!data?.airQuality?.current) return {};
    const c = data.airQuality.current;
    return {
      aqi: c.european_aqi,
      pm10: c.pm10,
      pm25: c.pm2_5,
      co: c.carbon_monoxide,
      no2: c.nitrogen_dioxide,
      so2: c.sulphur_dioxide,
    };
  }, [data]);

  /* Build hourly chart data array aligned to selected date */
  const hourlyData = useMemo(() => {
    const wh = data?.weather?.hourly;
    const aqh = data?.airQuality?.hourly;
    if (!wh) return [];

    /* Filter only the 24 hours belonging to the selected date */
    return wh.time
      .map((t, i) => ({
        hour: fmtHour(t),
        date: t.slice(0, 10),
        tempC: wh.temperature_2m?.[i] ?? null,
        tempF: wh.temperature_2m?.[i] != null ? parseFloat(toF(wh.temperature_2m[i])) : null,
        humidity: wh.relative_humidity_2m?.[i] ?? null,
        precipitation: wh.precipitation?.[i] ?? null,
        visibility: wh.visibility?.[i] != null ? (wh.visibility[i] / 1000).toFixed(2) : null,
        windSpeed: wh.wind_speed_10m?.[i] ?? null,
        pm10: aqh?.pm10?.[i] ?? null,
        pm25: aqh?.pm2_5?.[i] ?? null,
      }))
      .filter((r) => r.date === selectedDate);
  }, [data, selectedDate]);

  /* Toggle between Celsius and Fahrenheit */
  const handleUnitToggle = useCallback(() => setIsCelsius((v) => !v), []);

  /* Display temperatures based on the active unit */
  const displayTemp = useCallback(
    (c) => {
      if (c == null) return "—";
      return isCelsius ? `${c}` : `${toF(c)}`;
    },
    [isCelsius]
  );

  const tempUnit = isCelsius ? "°C" : "°F";
  const { label: aqiLbl, color: aqiColor } = aqiLabel(currentAQ.aqi);

  if (gpsLoading && !location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>Detecting your location…</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-8 overflow-x-hidden">

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

      {/* ── Header: location + date picker ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            {gpsLoading ? <span style={{ opacity: 0.3 }}>Detecting location…</span> : locationName || "Weather"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>

        {/* Calendar date picker */}
        <input
          type="date"
          value={selectedDate}
          max={todayStr()}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-xl px-4 py-2 text-sm focus:outline-none cursor-pointer"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            boxShadow: "0 0 0 0 transparent",
          }}
          onFocus={e => e.target.style.boxShadow = "0 0 0 2px var(--accent-border)"}
          onBlur={e => e.target.style.boxShadow = "0 0 0 0 transparent"}
        />
      </div>

      {/* ── Current Temperature Hero ── */}
      <div
        className="relative rounded-3xl p-6 overflow-hidden"
        style={{
          border: "1px solid var(--border)",
          background: "linear-gradient(135deg, var(--hero-from) 0%, var(--hero-to) 100%)",
        }}
      >
        {/* Large drifting background blobs */}
        <div className="blob-drift absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse, var(--accent) 0%, transparent 65%)" }} />
        <div className="blob-drift-slow absolute -bottom-12 -left-12 w-48 h-48 rounded-full pointer-events-none opacity-10"
          style={{ background: "radial-gradient(ellipse, var(--accent2) 0%, transparent 65%)" }} />

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 relative z-10">
          <div>
            <p className="text-sm uppercase tracking-widest font-semibold mb-1" style={{ color: "var(--muted)" }}>
              Current Temperature
            </p>
            {loading ? (
              <div className="h-20 w-40 rounded-xl animate-pulse" style={{ background: "var(--surface)" }} />
            ) : (
              <div className="flex items-end gap-3">
                <span className="text-7xl font-black leading-none" style={{ color: "var(--text)" }}>
                  {displayTemp(current.temp)}
                </span>
                <span className="text-3xl font-light mb-2" style={{ color: "var(--accent)" }}>{tempUnit}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 sm:ml-8">
            <div className="flex gap-3 text-sm">
              <span style={{ color: "var(--muted)" }}>High</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>{loading ? "…" : `${displayTemp(daily.tempMax)} ${tempUnit}`}</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span style={{ color: "var(--muted)" }}>Low</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>{loading ? "…" : `${displayTemp(daily.tempMin)} ${tempUnit}`}</span>
            </div>
            {currentAQ.aqi != null && (
              <div className="flex gap-3 text-sm mt-1 items-center">
                <span style={{ color: "var(--muted)" }}>Air Quality</span>
                <span className={`font-bold uppercase text-xs ${aqiColor}`}>{aqiLbl}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section: Atmospheric Conditions ── */}
      <Section title="Atmospheric Conditions">
        {loading ? (
          Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon="💧" label="Precipitation" value={daily.precipitation} unit="mm" accent="sky" />
            <StatCard icon="💦" label="Humidity" value={current.humidity ?? daily.humidity} unit="%" accent="cyan" />
            <StatCard icon="☀️" label="UV Index" value={daily.uvIndex} unit="" accent="amber"
              sub={daily.uvIndex >= 8 ? "Very High" : daily.uvIndex >= 6 ? "High" : daily.uvIndex >= 3 ? "Moderate" : "Low"} />
            <StatCard icon="🌅" label="Sunrise" value={fmtTime(daily.sunrise)} accent="orange" />
            <StatCard icon="🌇" label="Sunset" value={fmtTime(daily.sunset)} accent="rose" />
            <StatCard icon="💨" label="Max Wind Speed" value={daily.windSpeedMax} unit="km/h" accent="violet" />
            <StatCard icon="🌧" label="Precip. Probability" value={daily.precipProbMax} unit="%" accent="sky" />
          </>
        )}
      </Section>

      {/* ── Section: Air Quality ── */}
      <Section title="Air Quality Metrics">
        {loading ? (
          Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon="🌫" label="AQI (EU)" value={currentAQ.aqi} accent="emerald"
              sub={<AQIBadge aqi={currentAQ.aqi} />} />
            <StatCard icon="🟡" label="PM10" value={currentAQ.pm10?.toFixed(1)} unit="μg/m³" accent="amber" />
            <StatCard icon="🔴" label="PM2.5" value={currentAQ.pm25?.toFixed(1)} unit="μg/m³" accent="rose" />
            <StatCard icon="⚫" label="CO" value={currentAQ.co?.toFixed(0)} unit="μg/m³" accent="violet" />
            <StatCard icon="🟤" label="NO₂" value={currentAQ.no2?.toFixed(1)} unit="μg/m³" accent="orange" />
            <StatCard icon="🟠" label="SO₂" value={currentAQ.so2?.toFixed(1)} unit="μg/m³" accent="amber" />
            <StatCard icon="🌿" label="CO₂" value="~415" unit="ppm" accent="emerald"
              sub="Global avg (Open-Meteo doesn't provide CO₂)" />
          </>
        )}
      </Section>

      {/* ── Section: Hourly Charts ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text)" }}>Hourly Forecasts</h2>

          {/* Celsius / Fahrenheit toggle */}
          <button
            onClick={handleUnitToggle}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <span style={{ color: isCelsius ? "var(--accent)" : "var(--muted)" }}>°C</span>
            <span style={{ color: "var(--muted)" }}>|</span>
            <span style={{ color: !isCelsius ? "var(--accent)" : "var(--muted)" }}>°F</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden min-w-0">
          {loading ? (
            Array(6).fill(0).map((_, i) => <SkeletonChart key={i} />)
          ) : (
            <>
              <HourlyAreaChart title={`Temperature (${tempUnit})`} data={hourlyData} dataKey={isCelsius ? "tempC" : "tempF"} color="var(--accent)"  unit={tempUnit} />
              <HourlyAreaChart title="Relative Humidity (%)"        data={hourlyData} dataKey="humidity"                                               color="var(--accent2)" unit="%" />
              <HourlyBarChart  title="Precipitation (mm)"           data={hourlyData} dataKey="precipitation"                                          color="var(--accent)"  unit="mm" />
              <HourlyAreaChart title="Visibility (km)"              data={hourlyData} dataKey="visibility"                                             color="var(--accent2)" unit="km" />
              <HourlyAreaChart title="Wind Speed 10m (km/h)"        data={hourlyData} dataKey="windSpeed"                                              color="var(--accent)"  unit="km/h" />
              <PMChart data={hourlyData} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* Section layout wrapper with heading and responsive card grid */
function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-bold tracking-tight mb-4" style={{ color: "var(--text)" }}>{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {children}
      </div>
    </div>
  );
}
