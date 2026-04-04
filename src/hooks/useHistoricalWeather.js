import { useState, useEffect } from "react";

/* Clamps a date range to a max of 2 years from today */
function clampRange(start, end) {
  const e = new Date(end);
  const s = new Date(start);
  const maxStart = new Date(e);
  maxStart.setFullYear(maxStart.getFullYear() - 2);
  if (s < maxStart) return { start: maxStart.toISOString().split("T")[0], end };
  return { start, end };
}

/* Aggregates hourly AQ arrays into daily averages keyed by date string */
function aggregateHourlyAQtoDaily(hourly) {
  if (!hourly?.time) return { time: [], pm10: [], pm2_5: [] };

  const buckets = {}; // { "YYYY-MM-DD": { pm10: [], pm2_5: [] } }

  hourly.time.forEach((t, i) => {
    const date = t.slice(0, 10);
    if (!buckets[date]) buckets[date] = { pm10: [], pm2_5: [] };
    if (hourly.pm10?.[i]  != null) buckets[date].pm10.push(hourly.pm10[i]);
    if (hourly.pm2_5?.[i] != null) buckets[date].pm2_5.push(hourly.pm2_5[i]);
  });

  const dates = Object.keys(buckets).sort();
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  return {
    time:  dates,
    pm10:  dates.map((d) => avg(buckets[d].pm10)),
    pm2_5: dates.map((d) => avg(buckets[d].pm2_5)),
  };
}

/* Fetches historical daily weather + hourly AQ (aggregated to daily) */
export function useHistoricalWeather(location, startDate, endDate) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!location || !startDate || !endDate) return;

    const controller = new AbortController();

    async function fetch_data() {
      setLoading(true);
      setError(null);

      try {
        const { lat, lon } = location;
        const { start, end } = clampRange(startDate, endDate);

        /* Open-Meteo historical archive endpoint */
        const weatherUrl = new URL("https://archive-api.open-meteo.com/v1/archive");
        weatherUrl.searchParams.set("latitude", lat);
        weatherUrl.searchParams.set("longitude", lon);
        weatherUrl.searchParams.set("start_date", start);
        weatherUrl.searchParams.set("end_date", end);
        weatherUrl.searchParams.set("daily", [
          "temperature_2m_mean",
          "temperature_2m_max",
          "temperature_2m_min",
          "sunrise",
          "sunset",
          "precipitation_sum",
          "wind_speed_10m_max",
          "wind_direction_10m_dominant",
        ].join(","));
        weatherUrl.searchParams.set("timezone", "Asia/Kolkata");

        /* AQ API only supports hourly — fetch hourly and aggregate to daily averages */
        const aqUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
        aqUrl.searchParams.set("latitude", lat);
        aqUrl.searchParams.set("longitude", lon);
        aqUrl.searchParams.set("start_date", start);
        aqUrl.searchParams.set("end_date", end);
        aqUrl.searchParams.set("hourly", "pm10,pm2_5");
        aqUrl.searchParams.set("timezone", "Asia/Kolkata");

        const [wRes, aqRes] = await Promise.all([
          fetch(weatherUrl.toString(), { signal: controller.signal }),
          fetch(aqUrl.toString(),      { signal: controller.signal }),
        ]);

        if (!wRes.ok || !aqRes.ok) throw new Error("Historical API fetch failed.");

        const [wJson, aqJson] = await Promise.all([wRes.json(), aqRes.json()]);

        /* Aggregate hourly AQ into daily averages before storing */
        const dailyAQ = aggregateHourlyAQtoDaily(aqJson.hourly);

        setData({ weather: wJson, airQuality: { daily: dailyAQ } });
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetch_data();
    return () => controller.abort();
  }, [location, startDate, endDate]);

  return { data, loading, error };
}
