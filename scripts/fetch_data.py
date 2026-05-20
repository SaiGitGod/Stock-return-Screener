"""
Stock Return Screener — Daily Data Fetcher v3
==============================================
- Auto-fetches Nifty 500 stock list
- Pulls sector/industry from Yahoo Finance
- Calculates fixed timeframe returns (1D, 1W, 1M, 3M, 6M, 1Y)
- NEW: Saves daily closing prices so users can query custom date ranges
"""

import json
import os
import sys
import time
from datetime import datetime
import requests

import yfinance as yf
import pandas as pd

# ────────────────────────────────────────────────────────────────────────────
# STEP 1: Get the list of Nifty 500 stocks
# ────────────────────────────────────────────────────────────────────────────

def fetch_nifty500_list():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    symbols = []
    try:
        print("Trying to fetch Nifty 500 list from NSE India...")
        session = requests.Session()
        session.get("https://www.nseindia.com", headers=headers, timeout=10)
        time.sleep(1)
        url = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500"
        resp = session.get(url, headers={
            **headers,
            "Referer": "https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%20500"
        }, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            for item in data.get("data", []):
                sym = item.get("symbol", "").strip()
                if sym and sym != "NIFTY 500":
                    symbols.append(sym)
            print(f"  Got {len(symbols)} stocks from NSE India API")
    except Exception as e:
        print(f"  NSE India API failed: {e}")
    
    if len(symbols) < 100:
        print("  Falling back to curated stock list...")
        symbols = get_fallback_list()
        print(f"  Using {len(symbols)} stocks from fallback list")
    return symbols


def get_fallback_list():
    return [
        "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","HINDUNILVR","SBIN",
        "BHARTIARTL","ITC","KOTAKBANK","LT","AXISBANK","WIPRO","HCLTECH",
        "SUNPHARMA","MARUTI","TATAMOTORS","NTPC","POWERGRID","ONGC",
        "ULTRACEMCO","TITAN","ASIANPAINT","BAJFINANCE","BAJFINSV",
        "ADANIENT","ADANIPORTS","TECHM","DRREDDY","CIPLA","DIVISLAB",
        "TATASTEEL","HINDALCO","JSWSTEEL","COALINDIA","BPCL","GRASIM",
        "BRITANNIA","NESTLEIND","EICHERMOT","HEROMOTOCO","M&M","BAJAJ-AUTO",
        "TATACONSUM","INDUSINDBK","HDFCLIFE","SBILIFE","APOLLOHOSP",
        "BANKBARODA","PNB","CANBK","FEDERALBNK","IDFCFIRSTB","INDIGO",
        "ZOMATO","PAYTM","DMART","NYKAA","HAL","BEL","IRFC","TRENT",
        "PERSISTENT","COFORGE","POLYCAB","DIXON","JIOFIN","MAXHEALTH",
        "MANKIND","VEDL","NMDC","DLF","GODREJPROP","OBEROIRLTY",
        "PHOENIXLTD","MPHASIS","LTIM","PIIND","SRF","DEEPAKNTR",
        "TATAPOWER","NHPC","RECLTD","PFC","CGPOWER","SUZLON",
        "ABCAPITAL","MUTHOOTFIN","ICICIPRULI","MARICO","DABUR",
        "GODREJCP","PIDILITIND","HAVELLS","AMBUJACEM","SHREECEM",
        "BERGEPAINT","IDEA",
        "AARTIIND","ABB","ABBOTINDIA","ACC","ALKEM","AUROPHARMA",
        "BALKRISIND","BANDHANBNK","BHEL","BIOCON","CAMS","CHOLAFIN",
        "COLPAL","CONCOR","CROMPTON","CUB","CUMMINSIND","DALBHARAT",
        "ESCORTS","GAIL","GLAND","GMRINFRA","GUJGASLTD","HINDPETRO",
        "HONAUT","IPCALAB","IRCTC","JINDALSTEL","JUBLFOOD","LAURUSLABS",
        "LICI","LTTS","LUPIN","MANAPPURAM","MFSL","MOTHERSON","MRF",
        "NAM-INDIA","NAUKRI","NAVINFLUOR","OFSS","PAGEIND","PETRONET",
        "RAMCOCEM","SAIL","SIEMENS","TORNTPHARM","TVSMOTOR","UBL",
        "UNIONBANK","UPL","VOLTAS","ZYDUSLIFE",
        "ADANIGREEN","ADANIPOWER","AFFLE","ASTRAL","ATUL","BSOFT",
        "CANFINHOME","CDSL","CENTURYTEX","CLEAN","DELHIVERY","DEVYANI",
        "FACT","FIVESTAR","FORTIS","GRINDWELL","HAPPSTMNDS",
        "INDIANB","IOB","IOC","JKCEMENT","JSL","KALYANKJIL","KEI",
        "KPITTECH","LICHSGFIN","LLOYDSME","LODHA","LTFOODS","MCX",
        "NATCOPHARM","OLECTRA","PATANJALI","PNBHOUSING","POLICYBZR",
        "PRESTIGE","PVRINOX","RVNL","SBICARD","SONACOMS","STARHEALTH",
        "SUNTV","SUPREMEIND","SYNGENE","TATACHEM","TATACOMM","TATAELXSI",
        "TIINDIA","TORNTPOWER","TRIDENT","UNOMINDA","VBL","WHIRLPOOL",
        "YESBANK","ZEEL",
    ]


# ────────────────────────────────────────────────────────────────────────────
# STEP 2: Sector info from Yahoo Finance
# ────────────────────────────────────────────────────────────────────────────

SECTOR_MAP = {
    "Technology": "IT",
    "Information Technology": "IT",
    "Communication Services": "Telecom",
    "Consumer Cyclical": "Consumer",
    "Consumer Defensive": "FMCG",
    "Financial Services": "Finance",
    "Healthcare": "Pharma",
    "Basic Materials": "Materials",
    "Industrials": "Industrials",
    "Energy": "Energy",
    "Utilities": "Utilities",
    "Real Estate": "Realty",
}

def get_stock_info(symbol):
    try:
        ticker = yf.Ticker(f"{symbol}.NS")
        info = ticker.info
        name = info.get("shortName") or info.get("longName") or symbol
        name = name.replace(" Limited", "").replace(" Ltd.", "").replace(" Ltd", "").strip()
        raw_sector = info.get("sector", "Other")
        sector = SECTOR_MAP.get(raw_sector, raw_sector)
        return {
            "name": name,
            "sector": sector,
            "industry": info.get("industry", ""),
            "market_cap": info.get("marketCap", 0),
        }
    except:
        return {"name": symbol, "sector": "Other", "industry": "", "market_cap": 0}


# ────────────────────────────────────────────────────────────────────────────
# STEP 3: Calculate returns
# ────────────────────────────────────────────────────────────────────────────

def calculate_return(prices, days_ago):
    if prices is None or len(prices) < 2:
        return None
    latest = prices.iloc[-1]
    if days_ago >= len(prices):
        old = prices.iloc[0]
    else:
        old = prices.iloc[-(days_ago + 1)]
    if old == 0 or old is None:
        return None
    return round(((latest - old) / old) * 100, 2)


# ────────────────────────────────────────────────────────────────────────────
# STEP 4: Main fetch
# ────────────────────────────────────────────────────────────────────────────

def fetch_all_data(symbols):
    yf_symbols = [f"{s}.NS" for s in symbols]
    
    print(f"\n{'='*60}")
    print(f"Fetching price data for {len(yf_symbols)} stocks...")
    print(f"{'='*60}\n")
    
    price_data = yf.download(
        tickers=yf_symbols, period="1y", progress=True,
        threads=True, group_by="ticker"
    )
    
    results = []
    daily_prices = {}  # symbol -> list of [date, price]
    all_dates = set()
    errors = []
    total = len(symbols)
    
    print(f"\nProcessing individual stocks...")
    
    for idx, symbol in enumerate(symbols):
        yf_symbol = f"{symbol}.NS"
        try:
            if len(yf_symbols) == 1:
                close = price_data["Close"].dropna()
            else:
                close = price_data[yf_symbol]["Close"].dropna()
            
            if len(close) < 5:
                errors.append(f"  x {symbol}: insufficient data")
                continue
            
            if idx % 50 == 0 and idx > 0:
                print(f"\n  [{idx}/{total}] Pausing briefly...")
                time.sleep(2)
            
            info = get_stock_info(symbol)
            
            # Save daily prices for custom date range feature
            # Format: {date_string: price}
            prices_list = []
            for date, price in close.items():
                date_str = date.strftime("%Y-%m-%d")
                all_dates.add(date_str)
                prices_list.append(round(float(price), 2))
            
            # Store dates and prices separately for this stock
            stock_dates = [d.strftime("%Y-%m-%d") for d in close.index]
            daily_prices[symbol] = {
                "dates": stock_dates,
                "prices": prices_list
            }
            
            stock_data = {
                "symbol": symbol,
                "name": info["name"],
                "sector": info["sector"],
                "industry": info["industry"],
                "market_cap": info["market_cap"],
                "price": round(float(close.iloc[-1]), 2),
                "prev_close": round(float(close.iloc[-2]), 2) if len(close) >= 2 else None,
                "d1": calculate_return(close, 1),
                "w1": calculate_return(close, 5),
                "m1": calculate_return(close, 22),
                "m3": calculate_return(close, 66),
                "m6": calculate_return(close, 132),
                "y1": calculate_return(close, 252),
            }
            
            for k in ["d1", "w1", "m1", "m3", "m6", "y1"]:
                if stock_data[k] is None:
                    stock_data[k] = 0
            
            results.append(stock_data)
            status = f"1D:{stock_data['d1']:+.1f}% 1Y:{stock_data['y1']:+.1f}%"
            print(f"  ok [{idx+1}/{total}] {symbol}: {info['name']} ({info['sector']}) — {status}")
            
        except Exception as e:
            errors.append(f"  x {symbol}: {str(e)[:80]}")
    
    print(f"\n{'='*60}")
    print(f"Successfully fetched: {len(results)} stocks")
    if errors:
        print(f"Failed: {len(errors)} stocks")
        for e in errors[:20]:
            print(e)
    print(f"{'='*60}")
    
    return results, daily_prices


def main():
    symbols = fetch_nifty500_list()
    if not symbols:
        print("ERROR: Could not get any stock symbols.")
        sys.exit(1)
    
    print(f"\nGot {len(symbols)} stock symbols to process")
    
    results, daily_prices = fetch_all_data(symbols)
    
    if not results:
        print("\nERROR: No data fetched.")
        sys.exit(1)
    
    results.sort(key=lambda x: (-(x.get("market_cap") or 0), x["symbol"]))
    
    sector_counts = {}
    for s in results:
        sec = s["sector"]
        sector_counts[sec] = sector_counts.get(sec, 0) + 1
    
    # ── Save stocks.json (summary data — loads fast) ──
    output_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public", "data"
    )
    os.makedirs(output_dir, exist_ok=True)
    
    stocks_output = {
        "meta": {
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "stock_count": len(results),
            "source": "Yahoo Finance via yfinance",
            "sectors": sector_counts,
        },
        "stocks": results,
    }
    
    stocks_path = os.path.join(output_dir, "stocks.json")
    with open(stocks_path, "w") as f:
        json.dump(stocks_output, f)  # No indent — smaller file
    
    stocks_size = os.path.getsize(stocks_path)
    print(f"\n   stocks.json: {stocks_size / 1024:.0f} KB")
    
    # ── Save prices.json (daily prices — for custom date range) ──
    # Compact format: shared date array + per-stock price array
    # This keeps the file small (~1-2 MB for 500 stocks × 252 days)
    
    # Build a master date list (union of all trading dates, sorted)
    all_dates_set = set()
    for sym_data in daily_prices.values():
        all_dates_set.update(sym_data["dates"])
    master_dates = sorted(all_dates_set)
    
    # For each stock, create a price array aligned to master dates
    # Use null for dates where stock has no data
    date_to_idx = {d: i for i, d in enumerate(master_dates)}
    compact_prices = {}
    
    for symbol, sym_data in daily_prices.items():
        price_array = [None] * len(master_dates)
        for date_str, price in zip(sym_data["dates"], sym_data["prices"]):
            idx = date_to_idx[date_str]
            price_array[idx] = price
        compact_prices[symbol] = price_array
    
    prices_output = {
        "meta": {
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "date_count": len(master_dates),
            "stock_count": len(compact_prices),
        },
        "dates": master_dates,
        "prices": compact_prices,
    }
    
    prices_path = os.path.join(output_dir, "prices.json")
    with open(prices_path, "w") as f:
        json.dump(prices_output, f)  # No indent — compact
    
    prices_size = os.path.getsize(prices_path)
    print(f"   prices.json: {prices_size / 1024:.0f} KB ({prices_size / (1024*1024):.1f} MB)")
    
    print(f"\n   {len(results)} stocks | {len(master_dates)} trading days")
    print(f"   Updated: {stocks_output['meta']['updated_at']}")
    print(f"   Sectors: {sector_counts}")


if __name__ == "__main__":
    main()
