const shellStyles = {
  page: { minHeight: "100vh", background: WX.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--font-sans)" },
  phone: { position: "relative", width: 390, height: 780, background: WX.ink, border: "1px solid rgba(0,180,230,0.15)", borderRadius: 44, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: "14px 20px 20px", textAlign: "center", fontSize: 10, color: "rgba(224,234,240,0.25)", background: "linear-gradient(to top, rgba(8,12,26,0.95), transparent)", pointerEvents: "none" },
  picker: { position: "fixed", top: 20, left: 20, background: WX.surface, border: "1px solid rgba(0,180,230,0.2)", borderRadius: 14, padding: 10, display: "flex", flexDirection: "column", gap: 4 },
  pickerTitle: { fontSize: 10, color: "rgba(0,180,230,0.7)", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, padding: "4px 8px" },
  pickerBtn: (a) => ({ background: a ? "rgba(0,180,230,0.15)" : "transparent", color: a ? WX.cyan : "rgba(224,234,240,0.7)", border: "none", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }),
};

const SCREENS = [
  { id: "dashboard", label: "Home" },
  { id: "lesson", label: "Lesson detail" },
  { id: "setup", label: "Practice setup" },
  { id: "live", label: "Practice live" },
  { id: "complete", label: "Form complete" },
];

function App() {
  const [screen, setScreen] = React.useState(() => localStorage.getItem("wx-screen") || "dashboard");
  React.useEffect(() => { localStorage.setItem("wx-screen", screen); }, [screen]);

  const showHeader = screen === "dashboard" || screen === "lesson";

  return (
    <div style={shellStyles.page}>
      <div style={shellStyles.picker}>
        <div style={shellStyles.pickerTitle}>Screens</div>
        {SCREENS.map(s => (
          <button key={s.id} style={shellStyles.pickerBtn(screen === s.id)} onClick={() => setScreen(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={shellStyles.phone}>
        {showHeader && <Header screen={screen} onNav={setScreen} />}
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("lesson")} />}
        {screen === "lesson"    && <LessonDetail onBack={() => setScreen("dashboard")} onPractice={() => setScreen("setup")} />}
        {screen === "setup"     && <PracticeSetup onBack={() => setScreen("lesson")} onStart={() => setScreen("live")} />}
        {screen === "live"      && <PracticeLive onExit={() => setScreen("lesson")} onComplete={() => setScreen("complete")} />}
        {screen === "complete"  && <FormComplete onRestart={() => setScreen("live")} onExit={() => setScreen("dashboard")} />}
        {showHeader && <div style={shellStyles.footer}>武学 · WuXue · by Infinite Wushu</div>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
