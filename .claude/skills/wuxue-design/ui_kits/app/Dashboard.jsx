const dashStyles = {
  wrap: { padding: "4px 20px 28px", display: "flex", flexDirection: "column", gap: 16 },
  card: { background: WX.surface, border: "1px solid rgba(0,180,230,0.12)", borderRadius: 16, padding: 20 },
  eb: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(0,180,230,0.7)" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  title: { fontSize: 20, fontWeight: 700, color: WX.fg, marginTop: 4 },
  bigPct: { fontFamily: "var(--font-chinese)", fontSize: 28, fontWeight: 700, color: WX.cyan },
  bar: { height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginTop: 12 },
  fill: { height: "100%", background: `linear-gradient(90deg, ${WX.cyan}, ${WX.gold})` },
  continue: { background: WX.surface, border: "1px solid rgba(0,180,230,0.12)", borderRadius: 16, padding: 18, display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", cursor: "pointer" },
  contResume: { background: WX.cyan, color: WX.ink, padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer", fontFamily: "inherit" },
  vocabBadge: { background: WX.surface, border: "1px solid rgba(0,180,230,0.12)", borderRadius: 16, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" },
  vocabIcon: { width: 36, height: 36, borderRadius: 999, background: "rgba(212,160,48,0.1)", color: WX.gold, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  seg: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 4, background: "rgba(255,255,255,0.02)" },
  segBtn: (a) => ({ padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit", background: a ? "rgba(0,180,230,0.15)" : "transparent", color: a ? WX.cyan : "rgba(224,234,240,0.6)" }),
  catLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(224,234,240,0.5)" },
  modGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 },
  modCard: (locked) => ({ background: WX.surface, border: "1px solid rgba(0,180,230,0.12)", borderRadius: 16, padding: 14, position: "relative", opacity: locked ? 0.5 : 1, cursor: locked ? "default" : "pointer", display: "flex", flexDirection: "column", gap: 10 }),
  modTitle: { fontSize: 14, fontWeight: 700, color: WX.fg, marginTop: 2 },
  py: { fontStyle: "italic", color: "rgba(224,234,240,0.6)", fontSize: 11 },
  zh: { fontFamily: "var(--font-chinese)", color: "rgba(212,160,48,0.8)", marginLeft: 6, fontWeight: 700, fontSize: 12 },
};

const MODULES = [
  { id: "stances", cat: "Foundation", en: "Basic Stances", py: "Bùxíng", zh: "步型", done: 3, total: 5, unlocked: true },
  { id: "hand", cat: "Foundation", en: "Hand Techniques", py: "Shǒufǎ", zh: "手法", done: 2, total: 4, unlocked: true },
  { id: "wubuquan", cat: "Forms", en: "Five-Step Fist", py: "Wǔbùquán", zh: "五步拳", done: 0, total: 8, unlocked: false },
  { id: "changquan", cat: "Forms", en: "Elementary Long Fist", py: "Chūjí Chángquán", zh: "初级长拳", done: 0, total: 12, unlocked: false },
];

function ModCard({ m, onOpen }) {
  const pct = m.total ? Math.round((m.done / m.total) * 100) : 0;
  return (
    <div style={dashStyles.modCard(!m.unlocked)} onClick={() => m.unlocked && onOpen(m.id)}>
      {!m.unlocked && <div style={{ position: "absolute", right: 12, top: 12, color: "rgba(224,234,240,0.4)" }}><ILock size={14} /></div>}
      <div>
        <div style={{ ...dashStyles.eb, fontSize: 9, color: "rgba(0,180,230,0.6)" }}>{m.cat}</div>
        <div style={dashStyles.modTitle}>{m.en}</div>
        <div style={{ fontSize: 11, marginTop: 2 }}>
          <span style={dashStyles.py}>{m.py}</span><span style={dashStyles.zh}>{m.zh}</span>
        </div>
      </div>
      <div style={{ marginTop: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(224,234,240,0.6)" }}>
          <span>{m.done} / {m.total} lessons</span>
          <span style={{ color: WX.cyan, fontWeight: 600 }}>{pct}%</span>
        </div>
        <div style={{ ...dashStyles.bar, height: 4, marginTop: 6 }}><div style={{ ...dashStyles.fill, width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}

function Dashboard({ onOpen }) {
  const [zh, setZh] = React.useState("full");
  const modes = [{ v: "full", l: "Full" }, { v: "characters", l: "Char" }, { v: "pinyin", l: "Pinyin" }, { v: "english", l: "Eng" }];
  const done = MODULES.reduce((a, m) => a + m.done, 0);
  const total = MODULES.reduce((a, m) => a + m.total, 0);
  const pct = Math.round((done / total) * 100);

  const foundations = MODULES.filter(m => m.cat === "Foundation");
  const forms = MODULES.filter(m => m.cat === "Forms");

  return (
    <div style={dashStyles.wrap}>
      <div style={dashStyles.card}>
        <div style={dashStyles.row}>
          <div>
            <div style={dashStyles.eb}>Your journey</div>
            <div style={dashStyles.title}>{done} of {total} lessons complete</div>
          </div>
          <div style={dashStyles.bigPct}>{pct}%</div>
        </div>
        <div style={dashStyles.bar}><div style={{ ...dashStyles.fill, width: `${pct}%` }} /></div>
      </div>

      <div style={dashStyles.continue} onClick={() => onOpen("stances")}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={dashStyles.eb}>Continue learning</div>
          <div style={{ ...dashStyles.title, fontSize: 17 }}>Empty Stance</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            <span style={dashStyles.py}>xūbù</span><span style={dashStyles.zh}>虛步</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(224,234,240,0.5)", marginTop: 3 }}>Basic Stances</div>
        </div>
        <button style={dashStyles.contResume}>Resume <IArrow size={12} /></button>
      </div>

      <div style={dashStyles.vocabBadge}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={dashStyles.vocabIcon}><IBook size={16} /></div>
          <div>
            <div style={dashStyles.eb}>Daily review</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: WX.fg, marginTop: 1 }}>3 vocab cards due</div>
          </div>
        </div>
        <span style={{ fontSize: 10, color: WX.cyan, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>Review</span>
      </div>

      <div style={dashStyles.card}>
        <div style={dashStyles.eb}>Chinese display</div>
        <div style={{ ...dashStyles.seg, marginTop: 10 }}>
          {modes.map(m => <button key={m.v} style={dashStyles.segBtn(zh === m.v)} onClick={() => setZh(m.v)}>{m.l}</button>)}
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: WX.fg, margin: "0 0 10px" }}>Curriculum</h2>
        <div style={dashStyles.catLabel}>Basics</div>
        <div style={dashStyles.modGrid}>{foundations.map(m => <ModCard key={m.id} m={m} onOpen={onOpen} />)}</div>
        <div style={{ ...dashStyles.catLabel, marginTop: 18 }}>Elementary Routines <span style={{ fontFamily: "var(--font-chinese)", color: "rgba(212,160,48,0.6)", marginLeft: 8, textTransform: "none", letterSpacing: "normal" }}>初级套路</span></div>
        <div style={dashStyles.modGrid}>{forms.map(m => <ModCard key={m.id} m={m} onOpen={onOpen} />)}</div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
