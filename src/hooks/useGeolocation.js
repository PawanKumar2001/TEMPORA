import { useState, useEffect, useCallback } from "react";

/* Fallback coordinates — used only if all geolocation attempts fail */
const FALLBACK = { lat: 28.6139, lon: 77.209 }; // New Delhi

/* Queries the Permissions API to check current geolocation status */
async function checkPermission() {
  try {
    if (!navigator.permissions) return "unknown";
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state; // "granted" | "denied" | "prompt"
  } catch {
    return "unknown";
  }
}

/* Wraps getCurrentPosition in a Promise for cleaner async/await usage */
function getPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/* Attempts geolocation with progressively relaxed options */
async function attemptGeolocation() {
  const attempts = [
    /* Attempt 1 — high accuracy, short timeout */
    { enableHighAccuracy: true,  timeout: 8000,  maximumAge: 30000  },
    /* Attempt 2 — low accuracy, longer timeout */
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000  },
    /* Attempt 3 — accept any cached position up to 5 mins old */
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
  ];

  let lastError = null;

  for (const options of attempts) {
    try {
      const pos = await getPosition(options);
      return {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      };
    } catch (err) {
      lastError = err;
      /* Don't retry on explicit user denial (code 1) */
      if (err.code === 1) throw err;
    }
  }

  throw lastError;
}

/* Custom hook — requests GPS with retry logic, fallback, and manual retry support */
export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [permissionState, setPermissionState] = useState("unknown");

  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    /* Check if geolocation is supported at all */
    if (!navigator.geolocation) {
      setLocation(FALLBACK);
      setUsingFallback(true);
      setError("Geolocation is not supported by your browser. Showing data for New Delhi.");
      setLoading(false);
      return;
    }

    /* Check permission state before attempting */
    const permission = await checkPermission();
    setPermissionState(permission);

    if (permission === "denied") {
      /* Permission explicitly denied — use fallback immediately */
      setLocation(FALLBACK);
      setUsingFallback(true);
      setError("Location permission is blocked. Showing data for New Delhi. To fix: reset location permissions for this site in your browser settings.");
      setLoading(false);
      return;
    }

    try {
      const coords = await attemptGeolocation();
      setLocation(coords);
      setUsingFallback(false);
      setError(null);
    } catch (err) {
      /* Map GeolocationPositionError codes to helpful messages */
      const messages = {
        1: "Location access was denied. Showing data for New Delhi. Reset site permissions in your browser to fix this.",
        2: "Location unavailable (GPS signal lost or network error). Showing data for New Delhi.",
        3: "Location request timed out. Showing data for New Delhi.",
      };
      const msg = messages[err.code] || `Location error: ${err.message}. Showing data for New Delhi.`;

      /* Always fall back gracefully — never leave the app broken */
      setLocation(FALLBACK);
      setUsingFallback(true);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  return { location, error, loading, usingFallback, permissionState, retry: detect };
}
