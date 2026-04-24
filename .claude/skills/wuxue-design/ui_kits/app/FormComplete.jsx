const fcStyles = {
  wrap: { position: "absolute", inset: 0, background: WX.pBg, overflow: "auto", padding: "28px 20px 28px" },
  header: { textAlign: "center", marginBottom: 18 },
  tag: { color: WX.pRef, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em" },
  zh: { fontFamily: "var(--font-chinese)", color: WX.gold, fontSize: 48, fontWeight: 900, lineHeight: 1, marginTop: 6 },
  en: { color: "#fff", fontSize: 26, fontWeight: 900, lineHeight: 1.1, marginTop: 6 },
  scoreCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 18 },
  totalLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em" },
  totalScore: (c) => ({ color: c, fontSize: 84, fontWeight: 900, lineHeight: 1, textShadow: `0 0 30px ${c}55`, fontVariantNumeric: "tabular-nums" }),
  time: { color: "rgba(255,255,255,0.7)", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  breakdownLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 10 },
  breakdown: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, overflow: "hidden" },
  row: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  rowLast: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" },
  idx: { color: "rgba(255,255,255,0.35)", fontWeight: 900, fontSize: 22, width: 26, flexShrink: 0, fontVariantNumeric: "tabular-nums" },
  mTitle: { color: "#fff", fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  mZh: { fontFamily: "var(--font-chinese)", color: "rgba(255,255,255,0.5)", fontSize: 13 },
  mScore: (c) => ({ color: c, fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums", flexShrink: 0 }),
  weak: { color: WX.pFail, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 },
  actions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 },
  btnPrimary: { background: WX.pRef, color: WX.pBg, padding: "18px 14px", borderRadius: 16, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer", fontFamily: "inherit" },
  btnGhost: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", padding: "18px 14px", borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};

function scoreColor(s) {
  if (s >= 85) return WX.pPass;
  if (s >= 70) return "#A0FF4A";
  if (s >= 55) return WX.pWarn;
  return WX.pFail;
}

const MOVES = [
  { en: "Ready Stance", zh: "预备势", s: 88 },
  { en: "Bow Stance + Punch", zh: "弓步冲拳", s: 76 },
  { en: "Horse Stance + Block", zh: "马步架打", s: 62 },
  { en: "Empty Stance", zh: "虛步", s: 81 },
  { en: "Closing Stance", zh: "收势", s: 84 },
];

function FormComplete({ onRestart, onExit }) {
  const total = Math.round(MOVES.reduce((a, m) => a + m.s, 0) / MOVES.length);
  const lowest = Math.min(...MOVES.map(m => m.s));
  const totalColor = scoreColor(total);
  return (
    <div style={fcStyles.wrap}>
      <div style={fcStyles.header}>
        <div style={fcStyles.tag}>Form Complete</div>
        <div style={fcStyles.zh}>五步拳</div>
        <div style={fcStyles.en}>FIVE-STEP FIST</div>
      </div>

      <div style={fcStyles.scoreCard}>
        <div style={fcStyles.totalLabel}>Total Score</div>
        <div style={fcStyles.totalScore(totalColor)}>{total}</div>
        <div style={fcStyles.time}>1:42</div>
      </div>

      <div style={fcStyles.breakdownLabel}>Movement Breakdown</div>
      <div style={fcStyles.breakdown}>
        {MOVES.map((m, i) => {
          const isLast = i === MOVES.length - 1;
          const c = scoreColor(m.s);
          const weak = m.s === lowest;
          return (
            <div key={i} style={isLast ? fcStyles.rowLast : fcStyles.row}>
              <div style={fcStyles.idx}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={fcStyles.mTitle}>{m.en}</div>
                <div style={fcStyles.mZh}>{m.zh}</div>
              </div>
              <div style={fcStyles.mScore(c)}>{m.s}</div>
              {weak && <div style={fcStyles.weak}>← Weak</div>}
            </div>
          );
        })}
      </div>

      <div style={fcStyles.actions}>
        <button style={fcStyles.btnPrimary} onClick={onRestart}>Practice Again</button>
        <button style={fcStyles.btnGhost} onClick={onExit}>Exit</button>
      </div>
    </div>
  );
}

window.FormComplete = FormComplete;
