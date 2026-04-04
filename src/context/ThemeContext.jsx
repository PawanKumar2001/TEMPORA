import { createContext, useContext, useState, useEffect } from "react";

/* ── Theme Definitions ─────────────────────────────────────────────────────
   To add a new theme: copy an existing entry, give it a unique key,
   and update the CSS variable values. Everything in the app reads from
   these variables — no other file needs to change.
────────────────────────────────────────────────────────────────────────── */
export const THEMES = {
  blue: {
    label: "Arctic Blue",
    icon: "🧊",
    vars: {
      "--bg":            "#0b1120",
      "--bg2":           "#0d1526",
      "--bg-glass":      "rgba(11,17,32,0.65)",
      "--surface":       "rgba(255,255,255,0.05)",
      "--border":        "rgba(255,255,255,0.10)",
      "--accent":        "#22d3ee",
      "--accent2":       "#38bdf8",
      "--accent-dim":    "rgba(34,211,238,0.10)",
      "--accent-border": "rgba(34,211,238,0.30)",
      "--text":          "#f1f5f9",
      "--muted":         "#64748b",
      "--grid":          "rgba(255,255,255,0.05)",
      "--card-blob":     "#22d3ee",
      "--hero-from":     "rgba(8,145,178,0.20)",
      "--hero-to":       "rgba(11,17,32,0.90)",
      "--skeleton":      "rgba(255,255,255,0.08)",
    },
  },

  temporal: {
    label: "Temporal Gold",
    icon: "🌅",
    vars: {
      "--bg":            "#09080f",
      "--bg2":           "#100e1a",
      "--bg-glass":      "rgba(9,8,15,0.65)",
      "--surface":       "rgba(245,166,35,0.04)",
      "--border":        "rgba(245,166,35,0.12)",
      "--accent":        "#f5a623",
      "--accent2":       "#e8831a",
      "--accent-dim":    "rgba(245,166,35,0.10)",
      "--accent-border": "rgba(245,166,35,0.30)",
      "--text":          "#f5f0e8",
      "--muted":         "#7a6f5a",
      "--grid":          "rgba(245,166,35,0.07)",
      "--card-blob":     "#f5a623",
      "--hero-from":     "rgba(245,166,35,0.12)",
      "--hero-to":       "rgba(9,8,15,0.90)",
      "--skeleton":      "rgba(245,166,35,0.08)",
    },
  },

  emerald: {
    label: "Deep Forest",
    icon: "🌿",
    vars: {
      "--bg":            "#060f0a",
      "--bg2":           "#0a1a10",
      "--bg-glass":      "rgba(6,15,10,0.65)",
      "--surface":       "rgba(52,211,153,0.04)",
      "--border":        "rgba(52,211,153,0.12)",
      "--accent":        "#34d399",
      "--accent2":       "#10b981",
      "--accent-dim":    "rgba(52,211,153,0.10)",
      "--accent-border": "rgba(52,211,153,0.30)",
      "--text":          "#ecfdf5",
      "--muted":         "#4b7a62",
      "--grid":          "rgba(52,211,153,0.06)",
      "--card-blob":     "#34d399",
      "--hero-from":     "rgba(16,185,129,0.15)",
      "--hero-to":       "rgba(6,15,10,0.90)",
      "--skeleton":      "rgba(52,211,153,0.07)",
    },
  },

  rose: {
    label: "Crimson Dusk",
    icon: "🌹",
    vars: {
      "--bg":            "#0f080a",
      "--bg2":           "#1a0d10",
      "--bg-glass":      "rgba(15,8,10,0.65)",
      "--surface":       "rgba(244,63,94,0.04)",
      "--border":        "rgba(244,63,94,0.12)",
      "--accent":        "#f43f5e",
      "--accent2":       "#e11d48",
      "--accent-dim":    "rgba(244,63,94,0.10)",
      "--accent-border": "rgba(244,63,94,0.30)",
      "--text":          "#fff1f2",
      "--muted":         "#7a4a52",
      "--grid":          "rgba(244,63,94,0.06)",
      "--card-blob":     "#f43f5e",
      "--hero-from":     "rgba(225,29,72,0.15)",
      "--hero-to":       "rgba(15,8,10,0.90)",
      "--skeleton":      "rgba(244,63,94,0.07)",
    },
  },
};

/* ── Context ── */
const ThemeContext = createContext(null);

/* Applies CSS variables to :root so every component picks them up */
function applyTheme(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
}

/* Provider — wraps the whole app, persists theme choice to localStorage */
export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(
    () => localStorage.getItem("tempora-theme") || "blue"
  );

  /* Apply CSS variables whenever theme changes */
  useEffect(() => {
    const theme = THEMES[themeKey] || THEMES.blue;
    applyTheme(theme.vars);
    localStorage.setItem("tempora-theme", themeKey);
  }, [themeKey]);

  return (
    <ThemeContext.Provider value={{ themeKey, setThemeKey, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* Hook for any component that needs to read or change the theme */
export function useTheme() {
  return useContext(ThemeContext);
}
