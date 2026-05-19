import { useState, useMemo, useEffect, useRef } from "react";

// Consistency score: weighted count of positive returns across timeframes
// Longer timeframes get more weight — a stock up for 6 months matters more than one that popped today
function calcConsistency(s) {
  const weights = { d1: 0.05, w1: 0.10, m1: 0.15, m3: 0.20, m6: 0.25, y1: 0.25 };
  let score = 0;
  let maxScore = 0;
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

// ── Tiny components ──

function ReturnCell({ value }) {
  if (value === null || value === undefined || isNaN(value)) {
    return (
      <td style={{ padding:"10px 12px", textAlign:"right", color:"#334155",
        fontFamily:"'JetBrains Mono',monospace", fontSize:13, borderBottom:"1px solid rgba(128,128,128,0.08)" }}>
        —
      </td>
    );
  }
  const isPos = value > 0;
  const isZero = value === 0;
  const absVal = Math.abs(value).toFixed(1);
  const intensity = Math.min(Math.abs(value) / 50, 1);
  const bg = isZero ? "rgba(128,128,128,0.08)"
    : isPos ? `rgba(34,197,94,${0.06 + intensity * 0.18})`
    : `rgba(239,68,68,${0.06 + intensity * 0.18})`;
  const color = isZero ? "#888" : isPos ? "#16a34a" : "#dc2626";

  return (
    <td style={{
      padding:"10px 12px", textAlign:"right",
      fontFamily:"'JetBrains Mono','Fira Code','SF Mono',monospace",
      fontSize:13, fontWeight:600, color, background:bg,
      borderBottom:"1px solid rgba(128,128,128,0.08)",
      whiteSpace:"nowrap", letterSpacing:"-0.02em",
    }}>
      {isPos ? "+" : isZero ? "" : "−"}{absVal}%
    </td>
  );
}

function ConsistencyBadge({ score, allGreen }) {
  let bg, color, border;
  if (score >= 90) { bg="#052e16"; color="#4ade80"; border="#16a34a"; }
  else if (score >= 70) { bg="#1a2e05"; color="#a3e635"; border="#65a30d"; }
  else if (score >= 50) { bg="#1c1917"; color="#fbbf24"; border="#d97706"; }
  else { bg="#1c1013"; color="#f87171"; border="#dc2626"; }

  return (
    <td style={{ padding:"10px 12px", textAlign:"center", borderBottom:"1px solid rgba(128,128,128,0.08)" }}>
      <span style={{
        display:"inline-flex", alignItems:"center", gap:4,
        padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700,
        fontFamily:"'JetBrains Mono',monospace",
        color, background:bg, border:`1px solid ${border}44`,
      }}>
        {allGreen && <span style={{ fontSize:10 }}>●</span>}
        {score}
      </span>
    </td>
  );
}

function SortArrow({ active, dir }) {
  if (!active) return <span style={{ opacity:0.2, fontSize:10 }}>⇅</span>;
  return <span style={{ fontSize:10 }}>{dir === "desc" ? "↓" : "↑"}</span>;
}

// ── Main App ──

export default function App() {
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

  // Load data
  useEffect(() => {
    fetch("/data/stocks.json")
      .then(r => {
        if (!r.ok) throw new Error("Data not found");
        return r.json();
      })
      .then(data => {
        const processed = (data.stocks || []).map(s => ({
          ...s,
          consistency: calcConsistency(s),
          allGreen: isAllGreen(s),
        }));
        setStocks(processed);
        setMeta(data.meta || null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const sectors = useMemo(() => {
    const s = [...new Set(stocks.map(s => s.sector))].filter(Boolean).sort();
    return s;
  }, [stocks]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = stocks;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    if (sectorFilter !== "All") list = list.filter(s => s.sector === sectorFilter);
    if (onlyAllGreen) list = list.filter(s => s.allGreen);
    if (minScore > 0) list = list.filter(s => s.consistency >= minScore);

    list = [...list].sort((a, b) => {
      if (sortKey === "symbol") return sortDir === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      return sortDir === "desc" ? (b[sortKey]??-999) - (a[sortKey]??-999) : (a[sortKey]??-999) - (b[sortKey]??-999);
    });
    return list;
  }, [stocks, search, sortKey, sortDir, sectorFilter, onlyAllGreen, minScore]);

  const allGreenCount = stocks.filter(s => s.allGreen).length;
  const avgConsistency = stocks.length ? Math.round(stocks.reduce((a, b) => a + b.consistency, 0) / stocks.length) : 0;
  const topPerformers = stocks.filter(s => s.consistency >= 80).length;
  const underperformers = stocks.filter(s => s.consistency < 30).length;

  const exportCSV = () => {
    const header = "Rank,Symbol,Name,Sector,Score,1D%,1W%,1M%,3M%,6M%,1Y%,All Green\n";
    const rows = filtered.map((s, i) =>
      `${i+1},${s.symbol},"${s.name}",${s.sector},${s.consistency},${s.d1},${s.w1},${s.m1},${s.m3},${s.m6},${s.y1},${s.allGreen ? "Yes" : "No"}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-returns-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const headerStyle = (col) => ({
    padding:"12px 12px",
    textAlign: col === "symbol" || col === "sector" ? "left" : "right",
    fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
    color: sortKey === col ? "#e2e8f0" : "#64748b",
    cursor:"pointer", userSelect:"none",
    borderBottom:"2px solid #1e293b", whiteSpace:"nowrap",
    background: sortKey === col ? "rgba(99,102,241,0.06)" : "transparent",
    transition:"all 0.15s", position:"sticky", top:0, zIndex:2,
  });

  // ── Loading / Error states ──

  if (loading) {
    return (
      <div style={{ background:"#0a0e17", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:28, fontWeight:700, background:"linear-gradient(135deg,#818cf8,#6ee7b7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:12 }}>
            RETURN SCREENER
          </div>
          <div style={{ color:"#475569", fontSize:14 }}>Loading stock data…</div>
        </div>
      </div>
    );
  }

  if (error || stocks.length === 0) {
    return (
      <div style={{ background:"#0a0e17", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ textAlign:"center", maxWidth:500, padding:40 }}>
          <div style={{ fontSize:28, fontWeight:700, background:"linear-gradient(135deg,#818cf8,#6ee7b7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:16 }}>
            RETURN SCREENER
          </div>
          <div style={{ color:"#fbbf24", fontSize:16, fontWeight:600, marginBottom:8 }}>
            Data not loaded yet
          </div>
          <div style={{ color:"#475569", fontSize:14, lineHeight:1.6 }}>
            The stock data file hasn't been generated yet. The automated script runs daily after market close (around 4:30 PM IST).
            Once it runs for the first time, this page will show your stock data.
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ──

  return (
    <div style={{ background:"#0a0e17", minHeight:"100vh", color:"#e2e8f0", fontFamily:"'DM Sans','Helvetica Neue',sans-serif" }}>
      {/* Header */}
      <div style={{ padding:"28px 28px 0", maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <span style={{
                fontSize:22, fontWeight:700, letterSpacing:"-0.03em",
                background:"linear-gradient(135deg,#818cf8,#6ee7b7)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              }}>
                RETURN SCREENER
              </span>
              <span style={{
                fontSize:10, padding:"2px 8px", borderRadius:4,
                background:"#1e293b", color:"#94a3b8", fontWeight:600, letterSpacing:"0.05em",
              }}>NSE</span>
            </div>
            <p style={{ fontSize:13, color:"#475569", margin:0, fontWeight:500 }}>
              Multi-timeframe return consistency · {stocks.length} stocks
              {meta?.updated_at && (
                <span> · Updated {new Date(meta.updated_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span>
              )}
            </p>
          </div>

          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[
              { label:"All Green", value:allGreenCount, color:"#4ade80" },
              { label:"Score 80+", value:topPerformers, color:"#818cf8" },
              { label:"Avg Score", value:avgConsistency, color:"#fbbf24" },
              { label:"Weak (<30)", value:underperformers, color:"#f87171" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace" }}>{value}</div>
                <div style={{ fontSize:10, color:"#475569", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding:"16px 28px", maxWidth:1400, margin:"0 auto", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
        <input
          type="text" placeholder="Search stock or symbol…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background:"#111827", border:"1px solid #1e293b", borderRadius:8,
            padding:"8px 14px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", width:220, outline:"none",
          }}
        />
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
          style={{ background:"#111827", border:"1px solid #1e293b", borderRadius:8, padding:"8px 12px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
          <option value="All">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={minScore} onChange={e => setMinScore(Number(e.target.value))}
          style={{ background:"#111827", border:"1px solid #1e293b", borderRadius:8, padding:"8px 12px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
          <option value={0}>Min Score: Any</option>
          <option value={50}>Score ≥ 50</option>
          <option value={70}>Score ≥ 70</option>
          <option value={80}>Score ≥ 80</option>
          <option value={90}>Score ≥ 90</option>
        </select>
        <button onClick={() => setOnlyAllGreen(!onlyAllGreen)}
          style={{
            background: onlyAllGreen ? "#052e16" : "#111827",
            border:`1px solid ${onlyAllGreen ? "#16a34a" : "#1e293b"}`,
            borderRadius:8, padding:"8px 14px",
            color: onlyAllGreen ? "#4ade80" : "#64748b",
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
          }}>
          ● All Green Only
        </button>
        <button onClick={exportCSV}
          style={{
            background:"#111827", border:"1px solid #1e293b", borderRadius:8,
            padding:"8px 14px", color:"#818cf8", fontSize:13, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
          }}>
          ↓ Export CSV
        </button>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:12, color:"#475569", fontWeight:500 }}>
          {filtered.length} stock{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={{ padding:"0 28px 40px", maxWidth:1400, margin:"0 auto" }}>
        <div style={{ borderRadius:12, border:"1px solid #1e293b", overflow:"auto", maxHeight:"70vh", background:"#0f1629" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
            <thead style={{ background:"#0f1629" }}>
              <tr>
                <th style={{ ...headerStyle("rank"), textAlign:"center", width:44, cursor:"default" }}>#</th>
                <th onClick={() => toggleSort("symbol")} style={{ ...headerStyle("symbol"), minWidth:200 }}>
                  Stock <SortArrow active={sortKey==="symbol"} dir={sortDir} />
                </th>
                <th style={{ ...headerStyle("sector"), cursor:"default", width:90 }}>Sector</th>
                <th onClick={() => toggleSort("consistency")} style={{ ...headerStyle("consistency"), textAlign:"center", width:80 }}>
                  Score <SortArrow active={sortKey==="consistency"} dir={sortDir} />
                </th>
                {PERIOD_KEYS.map(k => (
                  <th key={k} onClick={() => toggleSort(k)} style={headerStyle(k)}>
                    {PERIOD_LABELS[k]} <SortArrow active={sortKey===k} dir={sortDir} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.symbol}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  style={{ transition:"background 0.1s", cursor:"default" }}>
                  <td style={{ padding:"10px 12px", textAlign:"center", fontSize:11, color:"#475569", fontFamily:"'JetBrains Mono',monospace", borderBottom:"1px solid rgba(128,128,128,0.08)", fontWeight:500 }}>
                    {i + 1}
                  </td>
                  <td style={{ padding:"10px 12px", borderBottom:"1px solid rgba(128,128,128,0.08)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:13, letterSpacing:"0.02em", color:"#e2e8f0", fontFamily:"'JetBrains Mono',monospace" }}>
                          {s.symbol}
                        </span>
                        <div style={{ fontSize:11, color:"#475569", fontWeight:500, marginTop:1 }}>{s.name}</div>
                      </div>
                      {s.allGreen && (
                        <span style={{ fontSize:8, padding:"1px 5px", borderRadius:3, background:"#052e16", color:"#4ade80", fontWeight:700, letterSpacing:"0.05em" }}>
                          ALL ↑
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:11, color:"#64748b", fontWeight:600, borderBottom:"1px solid rgba(128,128,128,0.08)", letterSpacing:"0.02em" }}>
                    {s.sector}
                  </td>
                  <ConsistencyBadge score={s.consistency} allGreen={s.allGreen} />
                  {PERIOD_KEYS.map(k => <ReturnCell key={k} value={s[k]} />)}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding:40, textAlign:"center", color:"#475569", fontSize:14 }}>
                    No stocks match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ marginTop:16, display:"flex", gap:24, flexWrap:"wrap", fontSize:11, color:"#475569" }}>
          <span><span style={{ color:"#4ade80" }}>●</span> Score 90+ = Strong across all timeframes</span>
          <span><span style={{ color:"#a3e635" }}>●</span> Score 70+ = Mostly consistent</span>
          <span><span style={{ color:"#fbbf24" }}>●</span> Score 50+ = Mixed signals</span>
          <span><span style={{ color:"#f87171" }}>●</span> Score &lt;50 = Weak or declining</span>
          <span style={{ color:"#4ade80", fontWeight:700 }}>ALL ↑</span><span> = Positive every timeframe</span>
        </div>
      </div>
    </div>
  );
}
