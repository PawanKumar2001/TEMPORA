import { useState, useEffect } from "react";

/* Reverse-geocodes lat/lon to a human-readable city name using Open-Meteo geocoding */
export function useLocationName(location) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!location) return;

    async function fetchName() {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lon}&format=json`
        );
        const json = await res.json();
        const city =
          json.address?.city ||
          json.address?.town ||
          json.address?.village ||
          json.address?.county ||
          "Unknown Location";
        const country = json.address?.country || "";
        setName(`${city}, ${country}`);
      } catch {
        setName("Your Location");
      }
    }

    fetchName();
  }, [location]);

  return name;
}
