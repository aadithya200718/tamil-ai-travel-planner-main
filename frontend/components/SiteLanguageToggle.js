import { useLanguage } from "../context/LanguageContext";

export default function SiteLanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div style={wrapStyle}>
      <button
        type="button"
        onClick={() => setLanguage("ta")}
        style={buttonStyle(language === "ta")}
        aria-pressed={language === "ta"}
      >
        தமிழ்
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        style={buttonStyle(language === "en")}
        aria-pressed={language === "en"}
      >
        EN
      </button>
    </div>
  );
}

const wrapStyle = {
  position: "fixed",
  top: 78,
  right: 16,
  zIndex: 2000,
  display: "flex",
  gap: 4,
  padding: 4,
  borderRadius: 999,
  background: "rgba(15, 23, 42, 0.82)",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.24)",
  backdropFilter: "blur(10px)",
};

function buttonStyle(active) {
  return {
    border: "none",
    borderRadius: 999,
    padding: "8px 12px",
    minWidth: 54,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: active ? "#0f172a" : "#e2e8f0",
    background: active ? "#ffffff" : "transparent",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  };
}
