const headerStyles = {
  bar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", gap: 12 },
  mark: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textDecoration: "none" },
  zh: { fontFamily: "var(--font-chinese)", fontWeight: 700, color: WX.gold, fontSize: 22, lineHeight: 1 },
  name: { display: "flex", flexDirection: "column", lineHeight: 1.05 },
  nameTop: { fontSize: 14, fontWeight: 700, color: WX.cyan, letterSpacing: "0.02em" },
  nameSub: { fontSize: 9, fontWeight: 500, color: "rgba(224,234,240,0.4)", letterSpacing: "0.1em" },
  nav: { display: "flex", alignItems: "center", gap: 2 },
  navItem: (active) => ({
    padding: "9px 11px", borderRadius: 10, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.15em", cursor: "pointer", background: active ? "rgba(0,180,230,0.1)" : "transparent",
    color: active ? WX.cyan : "rgba(224,234,240,0.5)", border: "none", fontFamily: "inherit",
  }),
  gear: (active) => ({
    width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: 10, color: active ? WX.cyan : "rgba(224,234,240,0.4)", cursor: "pointer",
  }),
};

function Header({ screen, onNav }) {
  const learnActive = screen === "dashboard" || screen === "lesson";
  return (
    <header style={headerStyles.bar}>
      <div style={headerStyles.mark} onClick={() => onNav("dashboard")}>
        <span style={headerStyles.zh}>武学</span>
        <div style={headerStyles.name}>
          <span style={headerStyles.nameTop}>WuXue</span>
          <span style={headerStyles.nameSub}>by Infinite Wushu</span>
        </div>
      </div>
      <nav style={headerStyles.nav}>
        <button style={headerStyles.navItem(learnActive)} onClick={() => onNav("dashboard")}>Learn</button>
        <button style={headerStyles.navItem(false)}>Vocab</button>
      </nav>
      <div style={headerStyles.gear(false)}><ISettings size={18} /></div>
    </header>
  );
}

window.Header = Header;
