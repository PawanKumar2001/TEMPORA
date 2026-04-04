import { BrowserRouter, Routes, Route } from "react-router-dom";
import CurrentWeather from "./pages/CurrentWeather";
import HistoricalWeather from "./pages/HistoricalWeather";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ThemeSwitcher from "./components/ThemeSwitcher";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col font-sans pt-24 sm:pt-28" style={{ background: "var(--bg)", color: "var(--text)" }}>
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/"        element={<CurrentWeather />} />
              <Route path="/history" element={<HistoricalWeather />} />
            </Routes>
          </div>
          <Footer />
          <ThemeSwitcher />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
