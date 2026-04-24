const setupStyles = {
  wrap: { position: "absolute", inset: 0, background: WX.pBg, display: "flex", flexDirection: "column", padding: "60px 20px 28px" },
  exit: { alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" },
  title: { fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginTop: 18 },
  zh: { fontFamily: "var(--font-chinese)", color: WX.gold, fontSize: 32, fontWeight: 700, lineHeight: 1 },
  pre: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  item: (st) => ({ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: `1px solid ${st === "ok" ? "rgba(0,255,136,0.3)" : st === "wait" ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.1)"}`, background: st === "ok" ? "rgba(0,255,136,0.06)" : st === "wait" ? "rgba(255,215,0,0.05)" : "rgba(255,255,255,0.02)" }),
  dot: (st) => ({ width: 28, height: 28, borderRadius: 999, background: st === "ok" ? WX.pPass : st === "wait" ? WX.pWarn : "rgba(255,255,255,0.08)", color: st === "ok" ? WX.pBg : st === "wait" ? WX.pBg : "rgba(255,255,255,0.5)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }),
  iLabel: { fontSize: 14, fontWeight: 700, color: "#fff" },
  iSub: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  notice: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", padding: 12, display: "flex", gap: 8, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 },
  begin: { background: WX.pRef, color: WX.pBg, padding: "18px 20px", borderRadius: 16, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", border: "none", cursor: "pointer", fontFamily: "inherit" },
};

function PracticeSetup({ onBack, onStart }) {
  return (
    <div style={setupStyles.wrap}>
      <button style={setupStyles.exit} onClick={onBack}><IBack size={12} /> Exit</button>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, color: WX.pRef, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em" }}>Pre-practice check</div>
        <div style={{ ...setupStyles.zh, marginTop: 6 }}>馬步</div>
        <div style={setupStyles.title}>Horse Stance</div>
      </div>

      <div style={setupStyles.pre}>
        <div style={setupStyles.list}>
          <div style={setupStyles.item("ok")}>
            <div style={setupStyles.dot("ok")}><ICheck size={14} /></div>
            <div style={{ flex: 1 }}>
              <div style={setupStyles.iLabel}>Camera ready</div>
              <div style={setupStyles.iSub}>Phone stabilized · 2–3 m from you</div>
            </div>
          </div>
          <div style={setupStyles.item("ok")}>
            <div style={setupStyles.dot("ok")}><ICheck size={14} /></div>
            <div style={{ flex: 1 }}>
              <div style={setupStyles.iLabel}>Body in frame</div>
              <div style={setupStyles.iSub}>Full body visible, head to feet</div>
            </div>
          </div>
          <div style={setupStyles.item("wait")}>
            <div style={setupStyles.dot("wait")}>!</div>
            <div style={{ flex: 1 }}>
              <div style={setupStyles.iLabel}>Lighting</div>
              <div style={setupStyles.iSub}>A little dim — move closer to a window if you can</div>
            </div>
          </div>
          <div style={setupStyles.item("")}>
            <div style={setupStyles.dot("")}>4</div>
            <div style={{ flex: 1 }}>
              <div style={setupStyles.iLabel}>Space cleared</div>
              <div style={setupStyles.iSub}>1.5 m around you in all directions</div>
            </div>
          </div>
        </div>

        <div style={setupStyles.notice}>
          <IInfo size={12} style={{ marginTop: 1, flexShrink: 0, color: "rgba(255,255,255,0.35)" }} />
          <span>AI evaluation is a training aid, not a replacement for coach feedback. Scoring accuracy depends on camera position, lighting, and body visibility.</span>
        </div>
      </div>

      <button style={setupStyles.begin} onClick={onStart}>
        Begin Practice
      </button>
    </div>
  );
}

window.PracticeSetup = PracticeSetup;
