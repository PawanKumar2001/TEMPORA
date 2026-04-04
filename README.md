# 🌤 Tempora

A responsive weather intelligence web application built with React + Vite. Tempora automatically detects your location via browser GPS and provides real-time weather conditions, hourly forecasts, and long-term historical climate analysis — all powered by the free [Open-Meteo API](https://open-meteo.com).

---

## Features

### Page 1 — Current Weather & Hourly Forecast
- Auto-detects location via browser GPS on load
- Date picker to view any past or current date
- **Individual metric cards:**
  - Temperature (Current, Min, Max)
  - Precipitation, Relative Humidity, UV Index
  - Sunrise & Sunset times
  - Max Wind Speed, Precipitation Probability
  - Air Quality Index (EU), PM10, PM2.5, CO, NO₂, SO₂
- **Hourly charts** with zoom (drag handles) and horizontal scroll:
  - Temperature (°C / °F toggle)
  - Relative Humidity
  - Precipitation
  - Visibility
  - Wind Speed (10m)
  - PM10 & PM2.5 (combined)

### Page 2 — Historical Analysis (up to 2 years)
- Custom date range picker with quick shortcuts (7D / 30D / 3M / 6M / 1Y / 2Y)
- Enforces a 2-year maximum range
- Summary stats: avg temperature, total precipitation, peak wind, days analyzed
- **Historical charts:**
  - Temperature trends (Mean, Max, Min) — Line chart
  - Sun Cycle: Sunrise & Sunset in IST — Composed Area + Line chart
  - Precipitation totals — Bar chart
  - Wind Speed & Dominant Direction — Composed Bar + Line (dual Y-axis)
  - Air Quality Trends: PM10 & PM2.5 with WHO guideline reference lines — Line chart

### General
- **4 built-in themes** — Arctic Blue, Temporal Gold, Deep Forest, Crimson Dusk
- Theme persists across sessions via `localStorage`
- Fully responsive — tested on iPhone SE, iPhone 12 Pro, iPhone 14 Pro
- Skeleton loaders on all cards and charts
- Horizontal scroll + Brush zoom on all charts

---

## 🛠 Tech Stack

| Tool | Purpose |
|---|---|
| [React 18](https://react.dev) | UI framework |
| [Vite 6](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Recharts](https://recharts.org) | Chart library |
| [React Router v6](https://reactrouter.com) | Client-side routing |
| [Open-Meteo](https://open-meteo.com) | Weather & air quality API (free, no key required) |
| [Nominatim](https://nominatim.org) | Reverse geocoding (OpenStreetMap) |

---

## APIs Used

All APIs are **free** and require **no API key**.

| API | Endpoint | Used For |
|---|---|---|
| Open-Meteo Forecast | `api.open-meteo.com/v1/forecast` | Current + hourly weather |
| Open-Meteo Air Quality | `air-quality-api.open-meteo.com/v1/air-quality` | AQI, PM10, PM2.5, CO, NO₂, SO₂ |
| Open-Meteo Archive | `archive-api.open-meteo.com/v1/archive` | Historical daily weather |
| Nominatim | `nominatim.openstreetmap.org/reverse` | Reverse geocoding |

---

## Project Structure

```
weather-app/
├── public/
├── src/
│   ├── context/
│   │   └── ThemeContext.jsx       # Theme system — 4 themes, CSS variables, localStorage
│   ├── hooks/
│   │   ├── useGeolocation.js      # Browser GPS detection
│   │   ├── useLocationName.js     # Reverse geocoding via Nominatim
│   │   ├── useWeather.js          # Current + hourly weather & AQ API
│   │   └── useHistoricalWeather.js # Historical archive API
│   ├── components/
│   │   ├── Navbar.jsx             # Fixed top navbar
│   │   ├── Footer.jsx             # Footer with version + GitHub link
│   │   ├── ThemeSwitcher.jsx      # Theme bar below navbar
│   │   ├── StatCard.jsx           # Individual metric card
│   │   ├── HourlyChart.jsx        # Hourly charts (Area, Bar, PM combined)
│   │   ├── HistoricalChart.jsx    # Historical charts (5 chart types)
│   │   ├── Skeleton.jsx           # Loading placeholders
│   │   └── AQIBadge.jsx           # Color-coded AQI label
│   ├── pages/
│   │   ├── CurrentWeather.jsx     # Page 1 — /
│   │   └── HistoricalWeather.jsx  # Page 2 — /history
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                  # Tailwind + CSS variables + animations
├── package.json
├── vite.config.js
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/tempora.git
cd tempora

# Install dependencies
npm install
```

### Running locally (HTTPS required for GPS)

```bash
npm run dev
```

> **Important:** The browser Geolocation API requires a secure origin. Run on `https://localhost:5173` and accept the self-signed certificate warning. Enable HTTPS in `vite.config.js`:

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    https: true,
  },
});
```

### Build for production

```bash
npm run build
npm run preview
```

---

## Theming

Tempora uses a CSS variable-based theme system. All 4 themes are defined in `src/context/ThemeContext.jsx`. To add a new theme, add an entry to the `THEMES` object — no other file needs to change.

```js
myTheme: {
  label: "My Theme",
  icon: "🔥",
  vars: {
    "--bg": "#...",
    "--accent": "#...",
    // ... other variables
  },
},
```

---

## Mobile Support

- Responsive layout tested on iPhone SE (375px), iPhone 12 Pro (390px), iPhone 14 Pro (430px)
- All charts support touch scroll and drag-to-zoom via Recharts `<Brush />`
- Navbar collapses gracefully on small screens

---

## 📄 License

MIT © 2026 Tempora