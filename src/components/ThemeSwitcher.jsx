import { useTheme, THEMES } from "../context/ThemeContext";

/* Theme bar  */
export default function ThemeSwitcher() {
  const { themeKey, setThemeKey } = useTheme();

  return (
    <div
      className="fixed top-[49px] sm:top-[57px] left-0 z-40 w-full flex items-center justify-center gap-2 py-2 sm:mt-2 border-b"
      style={{
        width: "100vw",
        background: "var(--bg-glass)",
        borderColor: "var(--border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
        Theme
      </span>

      <div className="w-px h-3 mx-1" style={{ background: "var(--border)" }} />

      {Object.keys(THEMES).map((key) => {
        const isActive = key === themeKey;
        return (
          <button
            key={key}
            onClick={() => setThemeKey(key)}
            title={THEMES[key].label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: isActive ? "var(--accent-dim)" : "transparent",
              border: isActive ? "1px solid var(--accent-border)" : "1px solid transparent",
              color: isActive ? "var(--accent)" : "var(--muted)",
            }}
          >
            <span>{THEMES[key].icon}</span>
            <span className="hidden sm:inline">{THEMES[key].label}</span>
          </button>
        );
      })}
    </div>
  );
}
