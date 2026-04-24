const lsnStyles = {
  wrap: { padding: "4px 20px 28px", display: "flex", flexDirection: "column", gap: 14 },
  back: { display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(224,234,240,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "inherit" },
  card: { background: WX.surface, border: "1px solid rgba(0,180,230,0.12)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16 },
  hTitle: { fontSize: 22, fontWeight: 700, color: WX.fg, letterSpacing: "-0.01em" },
  bili: { display: "flex", alignItems: "baseline", gap: 8, marginTop: 6, flexWrap: "wrap" },
  py: { fontStyle: "italic", color: "rgba(224,234,240,0.6)", fontSize: 14 },
  zh: { fontFamily: "var(--font-chinese)", color: WX.gold, fontSize: 22, fontWeight: 700 },
  speak: { width: 22, height: 22, borderRadius: 999, border: `1px solid ${WX.cyan}66`, color: WX.cyan, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", cursor: "pointer" },
  video: { aspectRatio: "16/9", borderRadius: 12, background: "linear-gradient(135deg, rgba(0,180,230,0.08), rgba(212,160,48,0.04))", border: "1px solid rgba(0,180,230,0.18)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  playBtn: { width: 56, height: 56, borderRadius: 999, background: "rgba(8,12,26,0.7)", border: `1px solid ${WX.cyan}66`, color: WX.cyan, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  desc: { fontSize: 14, lineHeight: 1.5, color: "rgba(224,234,240,0.85)" },
  sectionLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: WX.cyan, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 },
  li: { display: "flex", gap: 8, fontSize: 13, lineHeight: 1.5, color: "rgba(224,234,240,0.78)", marginBottom: 4 },
  warnBox: { borderRadius: 12, border: "1px solid rgba(232,93,74,0.25)", background: "rgba(232,93,74,0.05)", padding: 14 },
  warnLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: WX.crimson, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 },
  srcLine: { fontSize: 10, color: "rgba(224,234,240,0.4)", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" },
  practiceBtn: { background: WX.cyan, color: WX.ink, padding: "14px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", cursor: "pointer", width: "100%", fontFamily: "inherit" },
};

function LessonDetail({ onBack, onPractice }) {
  return (
    <div style={lsnStyles.wrap}>
      <button style={lsnStyles.back} onClick={onBack}><IBack size={14} /> Back to stances</button>

      <div style={lsnStyles.card}>
        <header>
          <h1 style={lsnStyles.hTitle}>Horse Stance</h1>
          <div style={lsnStyles.bili}>
            <span style={lsnStyles.py}>mǎbù</span>
            <span style={lsnStyles.zh}>馬步</span>
            <button style={lsnStyles.speak} aria-label="Speak"><IVolume size={11} /></button>
          </div>
        </header>

        <div style={lsnStyles.video}>
          <div style={lsnStyles.playBtn}><IPlay size={22} /></div>
          <div style={{ position: "absolute", bottom: 10, right: 12, fontSize: 10, color: "rgba(224,234,240,0.4)", fontFamily: "ui-monospace, monospace" }}>0:00 / 1:42</div>
        </div>

        <p style={lsnStyles.desc}>
          The foundational stance of Chinese martial arts. Feet twice shoulder-width apart, thighs parallel to the ground, back straight, weight centered.
        </p>

        <div>
          <div style={lsnStyles.sectionLabel}><ICheck size={12} /> Key Points</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {["Feet parallel, toes pointing forward", "Thighs parallel to the floor at full depth", "Back vertical, chest slightly open", "Weight distributed evenly 50/50"].map((p, i) =>
              <li key={i} style={lsnStyles.li}><span style={{ color: "rgba(0,180,230,0.6)" }}>·</span><span>{p}</span></li>
            )}
          </ul>
        </div>

        <div style={lsnStyles.warnBox}>
          <div style={lsnStyles.warnLabel}><IAlert size={12} /> Common Mistakes</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {["Knees caving inward past the toes", "Hips rising above thigh-parallel", "Leaning forward at the waist"].map((p, i) =>
              <li key={i} style={{ ...lsnStyles.li, color: "rgba(224,234,240,0.7)" }}><span style={{ color: "rgba(232,93,74,0.6)" }}>·</span><span>{p}</span></li>
            )}
          </ul>
        </div>

        <div style={lsnStyles.srcLine}>Source: Sunny Lai Wushu · <span style={{ color: "rgba(0,180,230,0.6)" }}>community</span></div>

        <button style={lsnStyles.practiceBtn} onClick={onPractice}>
          <ICamera size={14} /> Practice This Stance
        </button>
      </div>
    </div>
  );
}

window.LessonDetail = LessonDetail;
