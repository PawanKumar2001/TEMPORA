import { useState, useEffect } from "react";

/* Fetches weather + air quality data from Open-Meteo for a given date and coordinates */
export function useWeather(location, date) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location || !date) return;

    const controller = new AbortController();

    async function fetchWeather() {
      setLoading(true);
      setError(null);

      try {
        const { lat, lon } = location;

        /* Open-Meteo weather + hourly endpoint */
        const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
        weatherUrl.searchParams.set("latitude", lat);
        weatherUrl.searchParams.set("longitude", lon);
        weatherUrl.searchParams.set("start_date", date);
        weatherUrl.searchParams.set("end_date", date);
        weatherUrl.searchParams.set(
          "daily",
          [
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset",
            "uv_index_max",
            "precipitation_sum",
            "wind_speed_10m_max",
            "precipitation_probability_max",
            "relative_humidity_2m_max",
          ].join(",")
        );
        weatherUrl.searchParams.set(
          "hourly",
          [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation",
            "visibility",
            "wind_speed_10m",
            "pm10",
            "pm2_5",
          ].join(",")
        );
        weatherUrl.searchParams.set("current", [
          "temperature_2m",
          "relative_humidity_2m",
          "precipitation",
          "uv_index",
          "wind_speed_10m",
        ].join(","));
        weatherUrl.searchParams.set("timezone", "auto");

        /* Open-Meteo air quality endpoint */
        const aqUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
        aqUrl.searchParams.set("latitude", lat);
        aqUrl.searchParams.set("longitude", lon);
        aqUrl.searchParams.set("start_date", date);
        aqUrl.searchParams.set("end_date", date);
        aqUrl.searchParams.set(
          "hourly",
          [
            "pm10",
            "pm2_5",
            "carbon_monoxide",
            "nitrogen_dioxide",
            "sulphur_dioxide",
            "european_aqi",
          ].join(",")
        );
        aqUrl.searchParams.set("current", [
          "european_aqi",
          "pm10",
          "pm2_5",
          "carbon_monoxide",
          "nitrogen_dioxide",
          "sulphur_dioxide",
        ].join(","));

        const [weatherRes, aqRes] = await Promise.all([
          fetch(weatherUrl.toString(), { signal: controller.signal }),
          fetch(aqUrl.toString(), { signal: controller.signal }),
        ]);

        if (!weatherRes.ok || !aqRes.ok) throw new Error("API fetch failed.");

        const [weatherJson, aqJson] = await Promise.all([
          weatherRes.json(),
          aqRes.json(),
        ]);

        setData({ weather: weatherJson, airQuality: aqJson });
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    return () => controller.abort();
  }, [location, date]);

  return { data, loading, error };
}
