/* Maps European AQI numeric value to a color-coded label */
export function aqiLabel(aqi) {
  if (aqi == null) return { label: "N/A", color: "text-slate-400" };
  if (aqi <= 20) return { label: "Good", color: "text-emerald-400" };
  if (aqi <= 40) return { label: "Fair", color: "text-lime-400" };
  if (aqi <= 60) return { label: "Moderate", color: "text-yellow-400" };
  if (aqi <= 80) return { label: "Poor", color: "text-orange-400" };
  if (aqi <= 100) return { label: "Very Poor", color: "text-red-400" };
  return { label: "Hazardous", color: "text-rose-600" };
}

/* Badge component rendering AQI with appropriate color */
export function AQIBadge({ aqi }) {
  const { label, color } = aqiLabel(aqi);
  return (
    <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
}
