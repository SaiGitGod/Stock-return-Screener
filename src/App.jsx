import { useState, useMemo, useEffect } from "react";

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

function ReturnCell({ value }) {
  if (value === null || value === undefined || isNaN(value)) {
    return <td style={cellBase("#334155","rgba(128,128,128,0.08)")}>—</td>;
  }
  const isPos = value > 0, isZero = value === 0;
  const intensity = Math.min(Math.abs(value) / 50, 1);
  const bg = isZero ? "rgba(128,128,128,0.08)"
    : isPos ? `rgba(34,197,94,${0.06 + intensity * 0.18})`
    : `rgba(239,68,68,${0.06 + intensity * 0.18})`;
  const color = isZero ? "#888" : isPos ? "#16a34a" : "#dc2626";
  return (
    <td style={cellBase(color, bg)}>
      {isPos ? "+" : isZero ? "" : "−"}{Math.abs(value).toFixed(1)}%
    </td>
  );
}

function cellBase(color, bg) {
  return {
    padding: "10px 12px", textAlign: "right",
    fontFamily: "'JetBrains Mono','Fira Code',monospace",
    fontSize: 13, fontWeight: 600, color, background: bg,
    borderBottom: "1px solid rgba(128,128,128,0.08)",
    whiteSpace: "nowrap", letterSpacing: "-0.02em",
  };
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

  useEffect(() => {
    fetch("/data/stocks.json")
      .then(r => { if (!r.ok) throw new Error("Data not found"); return r.json(); })
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
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const sectors = useMemo(() => [...new Set(stocks.map(s => s.sector))].filter(Boolean).sort(), [stocks]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = stocks;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.industry || "").toLowerCase().includes(q)
      );
    }
    if (sectorFilter !== "All") list = list.filter(s => s.sector === sectorFilter);
    if (onlyAllGreen) list = list.filter(s => s.allGreen);
    if (minScore > 0) list = list.filter(s => s.consistency >= minScore);

    list = [...list].sort((a, b) => {
      if (sortKey === "symbol") return sortDir === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      if (sortKey === "market_cap") return sortDir === "desc" ? (b.market_cap||0) - (a.market_cap||0) : (a.market_cap||0) - (b.market_cap||0);
      return sortDir === "desc" ? (b[sortKey]??-999) - (a[sortKey]??-999) : (a[sortKey]??-999) - (b[sortKey]??-999);
    });
    return list;
  }, [stocks, search, sortKey, sortDir, sectorFilter, onlyAllGreen, minScore]);

  const allGreenCount = stocks.filter(s => s.allGreen).length;
  const avgConsistency = stocks.length ? Math.round(stocks.reduce((a, b) => a + b.consistency, 0) / stocks.length) : 0;
  const topPerformers = stocks.filter(s => s.consistency >= 80).length;
  const underperformers = stocks.filter(s => s.consistency < 30).length;

  const exportCSV = () => {
    const header = "Rank,Symbol,Name,Sector,Industry,Market Cap,Price,Score,1D%,1W%,1M%,3M%,6M%,1Y%,All Green\n";
    const rows = filtered.map((s, i) =>
      `${i+1},${s.symbol},"${s.name}",${s.sector},"${s.industry||""}",${s.market_cap||0},${s.price||0},${s.consistency},${s.d1},${s.w1},${s.m1},${s.m3},${s.m6},${s.y1},${s.allGreen?"Yes":"No"}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `stock-returns-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const hs = (col, extra={}) => ({
    padding:"12px 10px",
    textAlign: (col==="symbol"||col==="sector") ? "left" : "right",
    fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
    color: sortKey===col ? "#e2e8f0" : "#64748b",
    cursor:"pointer", userSelect:"none",
    borderBottom:"2px solid #1e293b", whiteSpace:"nowrap",
    background: sortKey===col ? "rgba(99,102,241,0.06)" : "transparent",
    transition:"all 0.15s", position:"sticky", top:0, zIndex:2,
    ...extra,
  });

  if (loading) {
    return (
      <div style={{ background:"#0a0e17", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:28, fontWeight:700, background:"linear-gradient(135deg,#818cf8,#6ee7b7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:12 }}>RETURN SCREENER</div>
          <div style={{ color:"#475569", fontSize:14 }}>Loading stock data…</div>
        </div>
      </div>
    );
  }

  if (error || stocks.length === 0) {
    return (
      <div style={{ background:"#0a0e17", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ textAlign:"center", maxWidth:500, padding:40 }}>
          <div style={{ fontSize:28, fontWeight:700, background:"linear-gradient(135deg,#818cf8,#6ee7b7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:16 }}>RETURN SCREENER</div>
          <div style={{ color:"#fbbf24", fontSize:16, fontWeight:600, marginBottom:8 }}>Data not loaded yet</div>
          <div style={{ color:"#475569", fontSize:14, lineHeight:1.6 }}>
            The stock data file hasn't been generated yet. The automated script runs daily after market close (~4:30 PM IST).
            Run the workflow manually from the GitHub Actions tab, or wait for the next scheduled run.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:"#0a0e17", minHeight:"100vh", color:"#e2e8f0", fontFamily:"'DM Sans','Helvetica Neue',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding:"24px 20px 0", maxWidth:1500, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <span style={{
                fontSize:22, fontWeight:700, letterSpacing:"-0.03em",
                background:"linear-gradient(135deg,#818cf8,#6ee7b7)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              }}>RETURN SCREENER</span>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:"#1e293b", color:"#94a3b8", fontWeight:600 }}>NSE</span>
            </div>
            <p style={{ fontSize:12, color:"#475569", margin:0, fontWeight:500 }}>
              {stocks.length} stocks · Sorted by consistency score
              {meta?.updated_at && <span> · Updated {new Date(meta.updated_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>}
            </p>
          </div>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
            {[
              { label:"All Green", value:allGreenCount, color:"#4ade80" },
              { label:"Score 80+", value:topPerformers, color:"#818cf8" },
              { label:"Avg Score", value:avgConsistency, color:"#fbbf24" },
              { label:"Weak (<30)", value:underperformers, color:"#f87171" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace" }}>{value}</div>
                <div style={{ fontSize:9, color:"#475569", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding:"14px 20px", maxWidth:1500, margin:"0 auto", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input type="text" placeholder="Search stock, name, or industry…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background:"#111827", border:"1px solid #1e293b", borderRadius:8, padding:"8px 12px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", width:240, outline:"none" }}
        />
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
          style={{ background:"#111827", border:"1px solid #1e293b", borderRadius:8, padding:"8px 10px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
          <option value="All">All Sectors ({stocks.length})</option>
          {sectors.map(s => {
            const count = stocks.filter(st => st.sector === s).length;
            return <option key={s} value={s}>{s} ({count})</option>;
          })}
        </select>
        <select value={minScore} onChange={e => setMinScore(Number(e.target.value))}
          style={{ background:"#111827", border:"1px solid #1e293b", borderRadius:8, padding:"8px 10px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
          <option value={0}>Min Score: Any</option>
          <option value={50}>Score ≥ 50</option>
          <option value={70}>Score ≥ 70</option>
          <option value={80}>Score ≥ 80</option>
          <option value={90}>Score ≥ 90</option>
        </select>
        <button onClick={() => setOnlyAllGreen(!onlyAllGreen)}
          style={{
            background: onlyAllGreen ? "#052e16" : "#111827",
            border: `1px solid ${onlyAllGreen ? "#16a34a" : "#1e293b"}`,
            borderRadius:8, padding:"8px 12px",
            color: onlyAllGreen ? "#4ade80" : "#64748b",
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
          }}>● All Green</button>
        <button onClick={exportCSV}
          style={{ background:"#111827", border:"1px solid #1e293b", borderRadius:8, padding:"8px 12px", color:"#818cf8", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          ↓ CSV
        </button>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:12, color:"#475569", fontWeight:500 }}>{filtered.length} shown</span>
      </div>

      {/* Table */}
      <div style={{ padding:"0 20px 40px", maxWidth:1500, margin:"0 auto" }}>
        <div style={{ borderRadius:12, border:"1px solid #1e293b", overflow:"auto", maxHeight:"72vh", background:"#0f1629" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1100 }}>
            <thead style={{ background:"#0f1629" }}>
              <tr>
                <th style={{ ...hs("rank",{textAlign:"center",width:40,cursor:"default"}) }}>#</th>
                <th onClick={() => toggleSort("symbol")} style={hs("symbol",{minWidth:180})}>
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.symbol}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  style={{ transition:"background 0.1s", cursor:"default" }}>
                  <td style={{ padding:"10px 8px", textAlign:"center", fontSize:11, color:"#475569", fontFamily:"'JetBrains Mono',monospace", borderBottom:"1px solid rgba(128,128,128,0.08)", fontWeight:500 }}>
                    {i + 1}
                  </td>
                  <td style={{ padding:"10px 10px", borderBottom:"1px solid rgba(128,128,128,0.08)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontWeight:700, fontSize:13, color:"#e2e8f0", fontFamily:"'JetBrains Mono',monospace" }}>{s.symbol}</span>
                          {s.allGreen && (
                            <span style={{ fontSize:7, padding:"1px 4px", borderRadius:3, background:"#052e16", color:"#4ade80", fontWeight:700 }}>ALL ↑</span>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:"#475569", fontWeight:500, marginTop:1 }}>{s.name}</div>
                        {s.industry && <div style={{ fontSize:10, color:"#334155", marginTop:1 }}>{s.industry}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"10px 8px", fontSize:11, color:"#64748b", fontWeight:600, borderBottom:"1px solid rgba(128,128,128,0.08)" }}>
                    {s.sector}
                  </td>
                  <td style={{ padding:"10px 8px", textAlign:"right", fontSize:11, color:"#64748b", fontFamily:"'JetBrains Mono',monospace", borderBottom:"1px solid rgba(128,128,128,0.08)", fontWeight:500 }}>
                    {formatMarketCap(s.market_cap)}
                  </td>
                  <td style={{ padding:"10px 8px", textAlign:"right", fontSize:12, color:"#94a3b8", fontFamily:"'JetBrains Mono',monospace", borderBottom:"1px solid rgba(128,128,128,0.08)", fontWeight:600 }}>
                    ₹{s.price ? s.price.toLocaleString("en-IN") : "—"}
                  </td>
                  <ConsistencyBadge score={s.consistency} allGreen={s.allGreen} />
                  {PERIOD_KEYS.map(k => <ReturnCell key={k} value={s[k]} />)}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={12} style={{ padding:40, textAlign:"center", color:"#475569", fontSize:14 }}>No stocks match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop:14, display:"flex", gap:20, flexWrap:"wrap", fontSize:11, color:"#475569" }}>
          <span><span style={{ color:"#4ade80" }}>●</span> 90+ Strong</span>
          <span><span style={{ color:"#a3e635" }}>●</span> 70+ Consistent</span>
          <span><span style={{ color:"#fbbf24" }}>●</span> 50+ Mixed</span>
          <span><span style={{ color:"#f87171" }}>●</span> &lt;50 Weak</span>
          <span style={{ color:"#4ade80", fontWeight:700 }}>ALL ↑</span><span>= Positive every timeframe</span>
          <span style={{ marginLeft:"auto", color:"#334155" }}>Sectors & names from Yahoo Finance · Returns = closing price change</span>
        </div>
      </div>
    </div>
  );
}
