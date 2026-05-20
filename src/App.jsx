import { useState, useMemo, useEffect, useCallback } from "react";

// ── Password Gate ──
// To change the password: replace the text inside the quotes below.
// Share this password with your friends so they can access the site.
const ACCESS_PASSWORD = "04051997";

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

const PASS_HASH = simpleHash(ACCESS_PASSWORD);

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (simpleHash(input.trim()) === PASS_HASH) {
      try { sessionStorage.setItem("tdb-auth", PASS_HASH); } catch {}
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#ffffff", fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{
        textAlign: "center", padding: 48, maxWidth: 380, width: "100%",
        animation: shake ? "shake 0.4s ease" : "none",
      }}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
        `}</style>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: "#2563eb",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: 24, color: "#fff", fontWeight: 700,
        }}>TB</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>The Daily Brief</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>Enter access code to continue</p>

        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Access code"
          autoFocus
          style={{
            width: "100%", padding: "14px 16px", fontSize: 15,
            border: `2px solid ${error ? "#ef4444" : "#e2e8f0"}`,
            borderRadius: 12, outline: "none", textAlign: "center",
            fontFamily: "'DM Sans', sans-serif", color: "#1e293b",
            background: "#f8fafc", letterSpacing: "0.1em",
            transition: "border 0.2s",
          }}
        />

        {error && (
          <p style={{ fontSize: 12, color: "#ef4444", marginTop: 10, fontWeight: 500 }}>
            Incorrect code. Try again.
          </p>
        )}

        <button onClick={handleSubmit} style={{
          width: "100%", padding: "13px 0", marginTop: 16, fontSize: 14,
          fontWeight: 700, color: "#ffffff", background: "#2563eb",
          border: "none", borderRadius: 12, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s",
        }}
          onMouseEnter={e => e.target.style.background = "#1d4ed8"}
          onMouseLeave={e => e.target.style.background = "#2563eb"}
        >
          Enter
        </button>

        <p style={{ fontSize: 11, color: "#cbd5e1", marginTop: 24 }}>
          Don't have access? Ask the admin.
        </p>
      </div>
    </div>
  );
}

// ── Theme definitions ──
const THEMES = {
  light: {
    bg: "#ffffff",
    bgSecondary: "#f8fafc",
    bgTable: "#ffffff",
    bgTableHover: "#f1f5f9",
    bgInput: "#f1f5f9",
    bgHeader: "#ffffff",
    bgPanel: "#f8fafc",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    text: "#1e293b",
    textSecondary: "#64748b",
    textMuted: "#94a3b8",
    textFaint: "#cbd5e1",
    accent: "#2563eb",
    accentLight: "#dbeafe",
    accentText: "#1d4ed8",
    green: "#16a34a",
    greenBg: "rgba(22,163,74,0.08)",
    greenBgStrong: "rgba(22,163,74,0.18)",
    red: "#dc2626",
    redBg: "rgba(220,38,38,0.06)",
    redBgStrong: "rgba(220,38,38,0.16)",
    badgeGreen: "#f0fdf4",
    badgeGreenBorder: "#bbf7d0",
    badgeYellow: "#fefce8",
    badgeYellowBorder: "#fef08a",
    badgeRed: "#fef2f2",
    badgeRedBorder: "#fecaca",
    badgeGreenStrong: "#dcfce7",
    badgeGreenStrongBorder: "#86efac",
    customHighlight: "#2563eb",
    toggleBg: "#e2e8f0",
    shadow: "0 1px 3px rgba(0,0,0,0.08)",
    shadowLg: "0 4px 12px rgba(0,0,0,0.06)",
  },
  dark: {
    bg: "#0a0e17",
    bgSecondary: "#0f1629",
    bgTable: "#0f1629",
    bgTableHover: "rgba(99,102,241,0.04)",
    bgInput: "#111827",
    bgHeader: "#0a0e17",
    bgPanel: "#111827",
    border: "#1e293b",
    borderLight: "rgba(128,128,128,0.08)",
    text: "#e2e8f0",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    textFaint: "#334155",
    accent: "#818cf8",
    accentLight: "#1e1b4b",
    accentText: "#a5b4fc",
    green: "#4ade80",
    greenBg: "rgba(34,197,94,0.06)",
    greenBgStrong: "rgba(34,197,94,0.22)",
    red: "#f87171",
    redBg: "rgba(239,68,68,0.06)",
    redBgStrong: "rgba(239,68,68,0.20)",
    badgeGreen: "#052e16",
    badgeGreenBorder: "#16a34a44",
    badgeYellow: "#1c1917",
    badgeYellowBorder: "#d9770644",
    badgeRed: "#1c1013",
    badgeRedBorder: "#dc262644",
    badgeGreenStrong: "#052e16",
    badgeGreenStrongBorder: "#16a34a",
    customHighlight: "#818cf8",
    toggleBg: "#1e293b",
    shadow: "none",
    shadowLg: "none",
  }
};

// ── Scoring ──
function calcConsistency(s) {
  const weights = { d1: 0.05, w1: 0.10, m1: 0.15, m3: 0.20, m6: 0.25, y1: 0.25 };
  let score = 0, maxScore = 0;
  for (const [k, w] of Object.entries(weights)) {
    maxScore += w;
    if (s[k] > 0) score += w;
    if (s[k] > 10) score += w * 0.3;
    if (s[k] > 25) score += w * 0.2;
  }
  return Math.round((score / maxScore) * 100);
}
function isAllGreen(s) {
  return s.d1 > 0 && s.w1 > 0 && s.m1 > 0 && s.m3 > 0 && s.m6 > 0 && s.y1 > 0;
}

const PERIOD_KEYS = ["d1","w1","m1","m3","m6","y1"];
const PERIOD_LABELS = { d1:"1D", w1:"1W", m1:"1M", m3:"3M", m6:"6M", y1:"1Y" };

function formatMarketCap(mc) {
  if (!mc || mc === 0) return "—";
  if (mc >= 1e12) return `₹${(mc/1e12).toFixed(1)}T`;
  if (mc >= 1e9) return `₹${(mc/1e9).toFixed(0)}B`;
  if (mc >= 1e7) return `₹${(mc/1e7).toFixed(0)}Cr`;
  return `₹${(mc/1e5).toFixed(0)}L`;
}

// ── Components ──

function ReturnCell({ value, t, highlight }) {
  if (value === null || value === undefined || isNaN(value)) {
    return <td style={cellStyle(t.textFaint, "transparent", t, highlight)}>—</td>;
  }
  const isPos = value > 0, isZero = value === 0;
  const intensity = Math.min(Math.abs(value) / 50, 1);
  const bg = isZero ? "transparent"
    : isPos ? (intensity > 0.3 ? t.greenBgStrong : t.greenBg)
    : (intensity > 0.3 ? t.redBgStrong : t.redBg);
  const color = isZero ? t.textMuted : isPos ? t.green : t.red;
  return (
    <td style={cellStyle(color, bg, t, highlight)}>
      {isPos ? "+" : isZero ? "" : "−"}{Math.abs(value).toFixed(1)}%
    </td>
  );
}

function cellStyle(color, bg, t, highlight) {
  return {
    padding: "11px 14px", textAlign: "right",
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 13, fontWeight: 600, color, background: bg,
    borderBottom: `1px solid ${t.borderLight}`,
    whiteSpace: "nowrap", letterSpacing: "-0.02em",
    ...(highlight ? { borderLeft: `2px solid ${t.customHighlight}`, borderRight: `2px solid ${t.customHighlight}` } : {}),
  };
}

function ConsistencyBadge({ score, allGreen, t }) {
  let bg, color, border;
  if (score >= 90) { bg = t.badgeGreenStrong; color = t.green; border = t.badgeGreenStrongBorder; }
  else if (score >= 70) { bg = t.badgeGreen; color = t.green; border = t.badgeGreenBorder; }
  else if (score >= 50) { bg = t.badgeYellow; color = "#eab308"; border = t.badgeYellowBorder; }
  else { bg = t.badgeRed; color = t.red; border = t.badgeRedBorder; }
  return (
    <td style={{ padding:"11px 14px", textAlign:"center", borderBottom:`1px solid ${t.borderLight}` }}>
      <span style={{
        display:"inline-flex", alignItems:"center", gap:4,
        padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700,
        fontFamily:"'JetBrains Mono',monospace",
        color, background:bg, border:`1px solid ${border}`,
      }}>
        {allGreen && <span style={{ fontSize:10 }}>●</span>}
        {score}
      </span>
    </td>
  );
}

function SortArrow({ active, dir }) {
  if (!active) return <span style={{ opacity:0.25, fontSize:10 }}>⇅</span>;
  return <span style={{ fontSize:10 }}>{dir === "desc" ? "↓" : "↑"}</span>;
}

function ThemeToggle({ isDark, onToggle, t }) {
  return (
    <button onClick={onToggle} style={{
      background: t.toggleBg, border: "none", borderRadius: 20,
      width: 52, height: 28, position: "relative", cursor: "pointer",
      transition: "background 0.2s",
    }}>
      <span style={{
        position: "absolute", top: 3, left: isDark ? 27 : 3,
        width: 22, height: 22, borderRadius: "50%",
        background: isDark ? "#818cf8" : "#2563eb",
        transition: "left 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12,
      }}>
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}

// ── Custom date helpers ──
function findClosestDate(dates, target, direction) {
  const targetTime = new Date(target).getTime();
  if (direction === "forward") {
    for (let i = 0; i < dates.length; i++) {
      if (new Date(dates[i]).getTime() >= targetTime) return i;
    }
    return dates.length - 1;
  } else {
    for (let i = dates.length - 1; i >= 0; i--) {
      if (new Date(dates[i]).getTime() <= targetTime) return i;
    }
    return 0;
  }
}
function calcCustomReturn(priceData, symbol, fromDate, toDate) {
  if (!priceData || !priceData.dates || !priceData.prices[symbol]) return null;
  const dates = priceData.dates;
  const prices = priceData.prices[symbol];
  const fromIdx = findClosestDate(dates, fromDate, "forward");
  const toIdx = findClosestDate(dates, toDate, "backward");
  if (fromIdx >= toIdx) return null;
  const fromPrice = prices[fromIdx];
  const toPrice = prices[toIdx];
  if (!fromPrice || !toPrice || fromPrice === 0) return null;
  return Math.round(((toPrice - fromPrice) / fromPrice) * 10000) / 100;
}
function formatDateShort(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}
function resolvePresetDate(code) {
  if (!code || !code.startsWith("__")) return code;
  const now = new Date();
  if (code === "__2w") { now.setDate(now.getDate() - 14); return now.toISOString().slice(0,10); }
  if (code === "__3d") { now.setDate(now.getDate() - 3); return now.toISOString().slice(0,10); }
  return code;
}

const PRESETS = [
  { label:"Iran Tensions Rebound", from:"2026-03-02", to:"", desc:"Mar 2 → today" },
  { label:"2026 YTD", from:"2026-01-01", to:"", desc:"Jan 1 → today" },
  { label:"Budget 2026", from:"2026-02-01", to:"2026-02-28", desc:"Feb month" },
  { label:"Q4 Earnings", from:"2026-04-01", to:"", desc:"Apr 1 → today" },
  { label:"Last 2 Weeks", from:"__2w", to:"", desc:"Recent" },
  { label:"Last 3 Days", from:"__3d", to:"", desc:"Short term" },
];

// ── Main App ──
export default function App() {
  const [authed, setAuthed] = useState(() => {
    try { return sessionStorage.getItem("tdb-auth") === PASS_HASH; } catch { return false; }
  });

  if (!authed) {
    return <PasswordGate onUnlock={() => setAuthed(true)} />;
  }

  return <Dashboard />;
}

function Dashboard() {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("tdb-theme") === "dark"; } catch { return false; }
  });
  const t = isDark ? THEMES.dark : THEMES.light;

  useEffect(() => {
    try { localStorage.setItem("tdb-theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);

  const [stocks, setStocks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("consistency");
  const [sortDir, setSortDir] = useState("desc");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [onlyAllGreen, setOnlyAllGreen] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [priceData, setPriceData] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [showDatePanel, setShowDatePanel] = useState(false);
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    fetch("/data/stocks.json")
      .then(r => { if (!r.ok) throw new Error("Data not found"); return r.json(); })
      .then(data => {
        const processed = (data.stocks || []).map(s => ({
          ...s, consistency: calcConsistency(s), allGreen: isAllGreen(s),
        }));
        setStocks(processed);
        setMeta(data.meta || null);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const loadPrices = useCallback(() => {
    if (priceData || pricesLoading) return;
    setPricesLoading(true);
    fetch("/data/prices.json")
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(data => { setPriceData(data); setPricesLoading(false); })
      .catch(() => setPricesLoading(false));
  }, [priceData, pricesLoading]);

  const handleOpenDatePanel = () => {
    setShowDatePanel(!showDatePanel);
    if (!priceData && !pricesLoading) loadPrices();
  };
  const applyPreset = (preset) => {
    setCustomFrom(resolvePresetDate(preset.from));
    setCustomTo(preset.to || new Date().toISOString().slice(0,10));
    setCustomLabel(preset.label);
    if (!priceData && !pricesLoading) loadPrices();
  };
  const clearCustom = () => {
    setCustomFrom(""); setCustomTo(""); setCustomLabel("");
    if (sortKey === "custom") setSortKey("consistency");
  };

  const hasCustomRange = customFrom && customTo && priceData;

  const customReturns = useMemo(() => {
    if (!hasCustomRange) return {};
    const returns = {};
    stocks.forEach(s => { returns[s.symbol] = calcCustomReturn(priceData, s.symbol, customFrom, customTo); });
    return returns;
  }, [stocks, priceData, customFrom, customTo, hasCustomRange]);

  const dateRangeInfo = useMemo(() => {
    if (!hasCustomRange) return null;
    const dates = priceData.dates;
    const fromIdx = findClosestDate(dates, customFrom, "forward");
    const toIdx = findClosestDate(dates, customTo, "backward");
    return { actualFrom: dates[fromIdx], actualTo: dates[toIdx], tradingDays: toIdx - fromIdx };
  }, [priceData, customFrom, customTo, hasCustomRange]);

  const sectors = useMemo(() => [...new Set(stocks.map(s => s.sector))].filter(Boolean).sort(), [stocks]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = stocks;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.industry||"").toLowerCase().includes(q));
    }
    if (sectorFilter !== "All") list = list.filter(s => s.sector === sectorFilter);
    if (onlyAllGreen) list = list.filter(s => s.allGreen);
    if (minScore > 0) list = list.filter(s => s.consistency >= minScore);
    list = [...list].sort((a, b) => {
      if (sortKey === "symbol") return sortDir === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      if (sortKey === "market_cap") return sortDir === "desc" ? (b.market_cap||0)-(a.market_cap||0) : (a.market_cap||0)-(b.market_cap||0);
      if (sortKey === "custom") { return sortDir === "desc" ? (customReturns[b.symbol]??-9999)-(customReturns[a.symbol]??-9999) : (customReturns[a.symbol]??-9999)-(customReturns[b.symbol]??-9999); }
      return sortDir === "desc" ? (b[sortKey]??-999)-(a[sortKey]??-999) : (a[sortKey]??-999)-(b[sortKey]??-999);
    });
    return list;
  }, [stocks, search, sortKey, sortDir, sectorFilter, onlyAllGreen, minScore, customReturns]);

  const stats = useMemo(() => ({
    allGreen: stocks.filter(s => s.allGreen).length,
    top: stocks.filter(s => s.consistency >= 80).length,
    avg: stocks.length ? Math.round(stocks.reduce((a,b) => a+b.consistency, 0) / stocks.length) : 0,
    weak: stocks.filter(s => s.consistency < 30).length,
  }), [stocks]);

  const exportCSV = () => {
    const hasC = hasCustomRange;
    const cLabel = customLabel || "Custom";
    const header = `Rank,Symbol,Name,Sector,Industry,Market Cap,Price,Score,1D%,1W%,1M%,3M%,6M%,1Y%${hasC?`,${cLabel}%`:""},All Green\n`;
    const rows = filtered.map((s,i) =>
      `${i+1},${s.symbol},"${s.name}",${s.sector},"${s.industry||""}",${s.market_cap||0},${s.price||0},${s.consistency},${s.d1},${s.w1},${s.m1},${s.m3},${s.m6},${s.y1}${hasC?`,${customReturns[s.symbol]??""}`:""},${s.allGreen?"Yes":"No"}`
    ).join("\n");
    const blob = new Blob([header + rows], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `daily-brief-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Styles ──
  const inputStyle = {
    background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 10,
    padding: "9px 14px", color: t.text, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
    outline: "none", transition: "border 0.15s",
  };
  const btnStyle = (active, activeColor) => ({
    background: active ? (isDark ? activeColor+"22" : activeColor+"12") : t.bgInput,
    border: `1px solid ${active ? activeColor : t.border}`,
    borderRadius: 10, padding: "9px 14px",
    color: active ? activeColor : t.textSecondary,
    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
    transition: "all 0.15s",
  });
  const hs = (col, extra={}) => ({
    padding: "12px 14px",
    textAlign: (col==="symbol"||col==="sector") ? "left" : "right",
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
    color: sortKey===col ? t.text : t.textMuted,
    cursor: "pointer", userSelect: "none",
    borderBottom: `2px solid ${t.border}`, whiteSpace: "nowrap",
    background: sortKey===col ? t.accentLight : "transparent",
    transition: "all 0.15s", position: "sticky", top: 0, zIndex: 2,
    ...extra,
  });

  // ── Loading / Error ──
  if (loading || error || stocks.length === 0) {
    return (
      <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 420, padding: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.accent, marginBottom: 12 }}>The Daily Brief</div>
          <div style={{ color: t.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
            {loading ? "Loading data…" : "Data not loaded yet. Run the workflow from GitHub Actions, or wait for the next scheduled update (~4:30 PM IST weekdays)."}
          </div>
        </div>
      </div>
    );
  }

  // ── Main ──
  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", transition: "background 0.3s, color 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{ background: t.bgHeader, borderBottom: `1px solid ${t.border}`, padding: "18px 24px", boxShadow: t.shadow, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1500, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: t.accent, letterSpacing: "-0.03em" }}>The Daily Brief</span>
                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: t.accentLight, color: t.accentText, fontWeight: 700, letterSpacing: "0.05em" }}>TDB</span>
              </div>
              <p style={{ fontSize: 11, color: t.textMuted, margin: "2px 0 0", fontWeight: 500 }}>
                {stocks.length} entries
                {meta?.updated_at && <span> · Updated {new Date(meta.updated_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {[
              { label:"All Green", value:stats.allGreen, color:t.green },
              { label:"Score 80+", value:stats.top, color:t.accent },
              { label:"Avg Score", value:stats.avg, color:"#eab308" },
              { label:"Weak", value:stats.weak, color:t.red },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace" }}>{value}</div>
                <div style={{ fontSize:8, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
              </div>
            ))}
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ padding:"14px 24px 0", maxWidth:1500, margin:"0 auto", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input type="text" placeholder="Search…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width:200 }}
        />
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
          style={{ ...inputStyle, cursor:"pointer" }}>
          <option value="All">All Sectors ({stocks.length})</option>
          {sectors.map(s => <option key={s} value={s}>{s} ({stocks.filter(st=>st.sector===s).length})</option>)}
        </select>
        <select value={minScore} onChange={e => setMinScore(Number(e.target.value))}
          style={{ ...inputStyle, cursor:"pointer" }}>
          <option value={0}>Min Score: Any</option>
          <option value={50}>≥ 50</option>
          <option value={70}>≥ 70</option>
          <option value={80}>≥ 80</option>
          <option value={90}>≥ 90</option>
        </select>
        <button onClick={() => setOnlyAllGreen(!onlyAllGreen)} style={btnStyle(onlyAllGreen, t.green)}>
          ● All Green
        </button>
        <button onClick={handleOpenDatePanel} style={btnStyle(showDatePanel || hasCustomRange, t.accent)}>
          📅 Custom Range{hasCustomRange ? " ✓" : ""}
        </button>
        <button onClick={exportCSV} style={btnStyle(false, t.accent)}>↓ CSV</button>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:12, color:t.textMuted, fontWeight:500 }}>{filtered.length} shown</span>
      </div>

      {/* ── Date Panel ── */}
      {showDatePanel && (
        <div style={{ padding:"10px 24px", maxWidth:1500, margin:"0 auto" }}>
          <div style={{ background:t.bgPanel, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px 18px", boxShadow:t.shadow }}>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Quick Presets</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => applyPreset(p)} style={{
                    background: customLabel===p.label ? t.accentLight : t.bgInput,
                    border: `1px solid ${customLabel===p.label ? t.accent : t.border}`,
                    borderRadius:8, padding:"6px 12px",
                    color: customLabel===p.label ? t.accentText : t.textSecondary,
                    fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  }}>
                    {p.label} <span style={{ fontSize:10, color:t.textMuted, marginLeft:4 }}>{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:12, color:t.textSecondary, fontWeight:600 }}>Or pick:</span>
              <label style={{ fontSize:11, color:t.textMuted }}>From</label>
              <input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setCustomLabel(""); }}
                style={{ ...inputStyle, width:145, colorScheme: isDark ? "dark" : "light" }} />
              <label style={{ fontSize:11, color:t.textMuted }}>To</label>
              <input type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setCustomLabel(""); }}
                style={{ ...inputStyle, width:145, colorScheme: isDark ? "dark" : "light" }} />
              {hasCustomRange && (
                <button onClick={clearCustom} style={{ ...btnStyle(true, t.red), padding:"6px 12px", fontSize:12 }}>✕ Clear</button>
              )}
              {pricesLoading && <span style={{ fontSize:12, color:"#eab308" }}>Loading prices…</span>}
            </div>
            {dateRangeInfo && (
              <div style={{ marginTop:8, fontSize:11, color:t.textMuted }}>
                Showing: <strong style={{ color:t.textSecondary }}>{formatDateShort(dateRangeInfo.actualFrom)}</strong> → <strong style={{ color:t.textSecondary }}>{formatDateShort(dateRangeInfo.actualTo)}</strong> ({dateRangeInfo.tradingDays} trading days)
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ padding:"14px 24px 40px", maxWidth:1500, margin:"0 auto" }}>
        <div style={{ borderRadius:12, border:`1px solid ${t.border}`, overflow:"auto", maxHeight:"70vh", background:t.bgTable, boxShadow:t.shadowLg }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth: hasCustomRange ? 1200 : 1100 }}>
            <thead>
              <tr style={{ background: t.bgSecondary }}>
                <th style={{ ...hs("rank",{textAlign:"center",width:40,cursor:"default"}) }}>#</th>
                <th onClick={() => toggleSort("symbol")} style={hs("symbol",{minWidth:170})}>
                  Stock <SortArrow active={sortKey==="symbol"} dir={sortDir} />
                </th>
                <th style={hs("sector",{cursor:"default",width:80})}>Sector</th>
                <th onClick={() => toggleSort("market_cap")} style={hs("market_cap",{textAlign:"right",width:80})}>
                  MCap <SortArrow active={sortKey==="market_cap"} dir={sortDir} />
                </th>
                <th onClick={() => toggleSort("price")} style={hs("price",{textAlign:"right",width:80})}>
                  Price <SortArrow active={sortKey==="price"} dir={sortDir} />
                </th>
                <th onClick={() => toggleSort("consistency")} style={hs("consistency",{textAlign:"center",width:70})}>
                  Score <SortArrow active={sortKey==="consistency"} dir={sortDir} />
                </th>
                {PERIOD_KEYS.map(k => (
                  <th key={k} onClick={() => toggleSort(k)} style={hs(k)}>
                    {PERIOD_LABELS[k]} <SortArrow active={sortKey===k} dir={sortDir} />
                  </th>
                ))}
                {hasCustomRange && (
                  <th onClick={() => toggleSort("custom")} style={{
                    ...hs("custom",{textAlign:"right"}),
                    borderLeft:`2px solid ${t.customHighlight}`, borderRight:`2px solid ${t.customHighlight}`,
                    background: sortKey==="custom" ? t.accentLight : (isDark ? "rgba(99,102,241,0.04)" : "rgba(37,99,235,0.03)"),
                  }}>
                    <div style={{ fontSize:10, color:t.accentText }}>{customLabel||"Custom"}</div>
                    <div style={{ fontSize:8, color:t.textMuted, marginTop:1 }}>
                      {formatDateShort(dateRangeInfo?.actualFrom)}→{formatDateShort(dateRangeInfo?.actualTo)}
                    </div>
                    <SortArrow active={sortKey==="custom"} dir={sortDir} />
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.symbol}
                  onMouseEnter={e => e.currentTarget.style.background = t.bgTableHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  style={{ transition:"background 0.1s" }}>
                  <td style={{ padding:"11px 10px", textAlign:"center", fontSize:11, color:t.textMuted, fontFamily:"'JetBrains Mono',monospace", borderBottom:`1px solid ${t.borderLight}`, fontWeight:500 }}>
                    {i + 1}
                  </td>
                  <td style={{ padding:"11px 12px", borderBottom:`1px solid ${t.borderLight}` }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontWeight:700, fontSize:13, color:t.text, fontFamily:"'JetBrains Mono',monospace" }}>{s.symbol}</span>
                        {s.allGreen && (
                          <span style={{ fontSize:7, padding:"1px 5px", borderRadius:3, background:isDark?"#052e16":t.greenBg, color:t.green, fontWeight:700, border:`1px solid ${t.green}33` }}>ALL ↑</span>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:t.textSecondary, fontWeight:500, marginTop:1 }}>{s.name}</div>
                      {s.industry && <div style={{ fontSize:10, color:t.textMuted, marginTop:1 }}>{s.industry}</div>}
                    </div>
                  </td>
                  <td style={{ padding:"11px 10px", fontSize:11, color:t.textSecondary, fontWeight:600, borderBottom:`1px solid ${t.borderLight}` }}>
                    {s.sector}
                  </td>
                  <td style={{ padding:"11px 10px", textAlign:"right", fontSize:11, color:t.textMuted, fontFamily:"'JetBrains Mono',monospace", borderBottom:`1px solid ${t.borderLight}` }}>
                    {formatMarketCap(s.market_cap)}
                  </td>
                  <td style={{ padding:"11px 10px", textAlign:"right", fontSize:12, color:t.textSecondary, fontFamily:"'JetBrains Mono',monospace", borderBottom:`1px solid ${t.borderLight}`, fontWeight:600 }}>
                    ₹{s.price ? s.price.toLocaleString("en-IN") : "—"}
                  </td>
                  <ConsistencyBadge score={s.consistency} allGreen={s.allGreen} t={t} />
                  {PERIOD_KEYS.map(k => <ReturnCell key={k} value={s[k]} t={t} />)}
                  {hasCustomRange && <ReturnCell value={customReturns[s.symbol]} t={t} highlight={true} />}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={hasCustomRange?13:12} style={{ padding:40, textAlign:"center", color:t.textMuted }}>No entries match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ marginTop:12, display:"flex", gap:16, flexWrap:"wrap", fontSize:11, color:t.textMuted }}>
          <span><span style={{ color:t.green }}>●</span> 90+ Strong</span>
          <span><span style={{ color:t.green, opacity:0.6 }}>●</span> 70+ Consistent</span>
          <span><span style={{ color:"#eab308" }}>●</span> 50+ Mixed</span>
          <span><span style={{ color:t.red }}>●</span> &lt;50 Weak</span>
          <span style={{ color:t.green, fontWeight:700 }}>ALL ↑</span><span>= Every timeframe positive</span>
        </div>
      </div>
    </div>
  );
}
