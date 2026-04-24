const liveStyles = {
  wrap: { position: "absolute", inset: 0, background: "#02060F", overflow: "hidden" },
  feed: { position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, #0a1530 0%, #050B1A 60%, #02060F 100%)" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5 },
  exit: { background: "rgba(8,12,26,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", padding: "8px 14px", borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", cursor: "pointer", fontFamily: "inherit" },
  stanceTag: { background: "rgba(8,12,26,0.6)", border: "1px solid rgba(0,212,255,0.3)", padding: "8px 14px", borderRadius: 12, display: "flex", gap: 8, alignItems: "baseline" },
  stanceZh: { fontFamily: "var(--font-chinese)", color: WX.gold, fontSize: 18, fontWeight: 700, lineHeight: 1 },
  stanceEn: { color: WX.pRef, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" },
  correction: { position: "absolute", top: "22%", left: 0, right: 0, textAlign: "center", zIndex: 4, padding: "0 16px" },
  correctionText: { color: WX.pWarn, fontSize: 32, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.1, textShadow: "0 2px 24px rgba(255,215,0,0.5), 0 0 8px rgba(0,0,0,0.8)", WebkitTextStroke: "1px rgba(0,0,0,0.3)" },
  dial: { position: "absolute", left: "50%", bottom: 172, transform: "translateX(-50%)", width: 150, height: 150, zIndex: 5 },
  dialSvg: { position: "absolute", inset: 0, transform: "rotate(-90deg)" },
  dialCenter: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  score: { fontWeight: 900, fontSize: 58, lineHeight: 1, color: WX.pWarn, textShadow: `0 0 20px ${WX.pWarn}55`, fontVariantNumeric: "tabular-nums" },
  hold: { fontWeight: 700, fontSize: 10, letterSpacing: "0.25em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginTop: 2 },
  panel: { position: "absolute", left: 14, right: 14, bottom: 20, background: "rgba(8,12,26,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" },
  panelNum: { width: 52, height: 52, borderRadius: 999, background: "rgba(255,215,0,0.15)", color: WX.pWarn, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, flexShrink: 0, fontVariantNumeric: "tabular-nums" },
  checks: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 },
  checkRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 11, lineHeight: 1.3 },
  checkDot: (c) => ({ width: 6, height: 6, borderRadius: 999, background: c, flexShrink: 0 }),
  checkLabel: { width: 78, color: "rgba(255,255,255,0.55)", fontSize: 11, flexShrink: 0 },
  checkVal: (c) => ({ fontFamily: "ui-monospace, monospace", fontWeight: 700, color: c, fontSize: 11 }),
  checkMsg: { color: "rgba(255,255,255,0.6)", fontSize: 11, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  feedback: { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 6 },
};

// Skeleton overlay — approximate pose landmarks (mediapipe-style)
function SkeletonOverlay() {
  // coordinates in 0..1 space, rendered in a viewBox
  const P = {
    nose: [0.50, 0.22], lEye: [0.485, 0.210], rEye: [0.515, 0.210],
    lShoulder: [0.42, 0.33], rShoulder: [0.58, 0.33],
    lElbow: [0.36, 0.47], rElbow: [0.64, 0.47],
    lWrist: [0.33, 0.60], rWrist: [0.67, 0.60],
    lHip: [0.44, 0.55], rHip: [0.56, 0.55],
    lKnee: [0.36, 0.73], rKnee: [0.64, 0.73],
    lAnkle: [0.36, 0.90], rAnkle: [0.64, 0.90],
  };
  const bones = [
    ["lShoulder", "rShoulder"],
    ["lShoulder", "lElbow"], ["lElbow", "lWrist"],
    ["rShoulder", "rElbow"], ["rElbow", "rWrist"],
    ["lShoulder", "lHip"], ["rShoulder", "rHip"], ["lHip", "rHip"],
    ["lHip", "lKnee"], ["lKnee", "lAnkle"],
    ["rHip", "rKnee"], ["rKnee", "rAnkle"],
    ["nose", "lShoulder"], ["nose", "rShoulder"],
  ];
  // Warn knees (left knee caving)
  const warnPoints = new Set(["lKnee", "rKnee"]);
  const warnBones = new Set(["lHip|lKnee", "rHip|rKnee"]);

  return (
    <svg viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet"
         style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3 }}>
      {/* bones */}
      {bones.map(([a, b], i) => {
        const key = `${a}|${b}`;
        const warn = warnBones.has(key);
        return (
          <line key={i} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]}
                stroke={warn ? WX.pWarn : WX.pRef} strokeWidth={0.008} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 0.004px ${warn ? WX.pWarn : WX.pRef})` }} />
        );
      })}
      {/* joints */}
      {Object.entries(P).map(([k, [x, y]]) => {
        const warn = warnPoints.has(k);
        return (
          <circle key={k} cx={x} cy={y} r={warn ? 0.015 : 0.011}
                  fill={warn ? WX.pWarn : WX.pRef}
                  style={{ filter: `drop-shadow(0 0 0.004px ${warn ? WX.pWarn : WX.pRef})` }} />
        );
      })}
    </svg>
  );
}

function PracticeLive({ onExit, onComplete }) {
  const [secs, setSecs] = React.useState(0);
  const [score, setScore] = React.useState(62);
  React.useEffect(() => {
    const t = setInterval(() => {
      setSecs(s => {
        const n = +(s + 0.1).toFixed(1);
        if (n >= 2) { clearInterval(t); setTimeout(onComplete, 600); return 2; }
        return n;
      });
      setScore(s => Math.min(84, s + 1));
    }, 130);
    return () => clearInterval(t);
  }, [onComplete]);
  const target = 2;
  const progress = Math.min(secs / target, 1);
  const circ = 2 * Math.PI * 65;
  const off = circ * (1 - progress);
  const color = score >= 70 ? WX.pPass : score >= 40 ? WX.pWarn : WX.pFail;

  return (
    <div style={liveStyles.wrap}>
      <div style={liveStyles.feed} />
      <SkeletonOverlay />

      <div style={liveStyles.topBar}>
        <button style={liveStyles.exit} onClick={onExit}>Exit</button>
        <div style={liveStyles.stanceTag}>
          <span style={liveStyles.stanceZh}>馬步</span>
          <span style={liveStyles.stanceEn}>Horse Stance</span>
        </div>
      </div>

      {score < 70 && (
        <div style={liveStyles.correction}>
          <div style={liveStyles.correctionText}>LOWER HIPS</div>
        </div>
      )}

      <div style={liveStyles.dial}>
        <svg style={liveStyles.dialSvg} viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="65" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
          <circle cx="75" cy="75" r="65" fill="none" stroke={color} strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
                  style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s ease" }} />
        </svg>
        <div style={liveStyles.dialCenter}>
          <div style={{ ...liveStyles.score, color, textShadow: `0 0 20px ${color}55` }}>{score}</div>
          <div style={liveStyles.hold}>{secs >= target ? "OFFICIAL" : `${secs.toFixed(1)}s`}</div>
        </div>
      </div>

      <div style={liveStyles.panel}>
        <div style={{ ...liveStyles.panelNum, background: `${color}22`, color }}>{score}</div>
        <div style={liveStyles.checks}>
          <div style={liveStyles.checkRow}>
            <span style={liveStyles.checkDot(WX.pWarn)} />
            <span style={liveStyles.checkLabel}>Hip depth</span>
            <span style={liveStyles.checkVal(WX.pWarn)}>62°</span>
            <span style={liveStyles.checkMsg}>Thighs not yet parallel</span>
          </div>
          <div style={liveStyles.checkRow}>
            <span style={liveStyles.checkDot("#22c55e")} />
            <span style={liveStyles.checkLabel}>Foot width</span>
            <span style={liveStyles.checkVal("#22c55e")}>2.1×</span>
            <span style={liveStyles.checkMsg}>Good</span>
          </div>
          <div style={liveStyles.checkRow}>
            <span style={liveStyles.checkDot(WX.crimson)} />
            <span style={liveStyles.checkLabel}>Back tilt</span>
            <span style={liveStyles.checkVal(WX.crimson)}>18°</span>
            <span style={liveStyles.checkMsg}>Straighten your back</span>
          </div>
          <div style={liveStyles.feedback}>Almost there — a little lower.</div>
        </div>
      </div>
    </div>
  );
}

window.PracticeLive = PracticeLive;
