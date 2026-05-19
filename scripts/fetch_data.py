"""
Stock Return Screener — Daily Data Fetcher v2
==============================================
- Automatically fetches the Nifty 500 stock list (no hardcoded list)
- Pulls sector/industry classification from Yahoo Finance directly
- Calculates returns over 1D, 1W, 1M, 3M, 6M, 1Y
- Saves as JSON for the dashboard

Runs automatically via GitHub Actions every weekday after market close.
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
# We try multiple sources to be resilient
# ────────────────────────────────────────────────────────────────────────────

def fetch_nifty500_list():
    """Fetch current Nifty 500 constituents from NSE India's website."""
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    symbols = []
    
    # Method 1: Try NSE India's index constituents CSV
    try:
        print("Trying to fetch Nifty 500 list from NSE India...")
        
        # First hit the main page to get cookies
        session = requests.Session()
        session.get("https://www.nseindia.com", headers=headers, timeout=10)
        time.sleep(1)
        
        # Then fetch the index constituents
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
    
    # Method 2: Fallback — use a curated list of ~200 major stocks
    # This ensures the script never fails completely
    if len(symbols) < 100:
        print("  Falling back to curated stock list (~200 stocks)...")
        symbols = get_fallback_list()
        print(f"  Using {len(symbols)} stocks from fallback list")
    
    return symbols


def get_fallback_list():
    """Fallback list of ~200 major NSE stocks if the live fetch fails."""
    return [
        # Nifty 50
        "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","HINDUNILVR","SBIN",
        "BHARTIARTL","ITC","KOTAKBANK","LT","AXISBANK","WIPRO","HCLTECH",
        "SUNPHARMA","MARUTI","TATAMOTORS","NTPC","POWERGRID","ONGC",
        "ULTRACEMCO","TITAN","ASIANPAINT","BAJFINANCE","BAJFINSV",
        "ADANIENT","ADANIPORTS","TECHM","DRREDDY","CIPLA","DIVISLAB",
        "TATASTEEL","HINDALCO","JSWSTEEL","COALINDIA","BPCL","GRASIM",
        "BRITANNIA","NESTLEIND","EICHERMOT","HEROMOTOCO","M&M","BAJAJ-AUTO",
        "TATACONSUM","INDUSINDBK","HDFCLIFE","SBILIFE","APOLLOHOSP",
        
        # Nifty Next 50
        "BANKBARODA","PNB","CANBK","FEDERALBNK","IDFCFIRSTB","INDIGO",
        "ZOMATO","PAYTM","DMART","NYKAA","HAL","BEL","IRFC","TRENT",
        "PERSISTENT","COFORGE","POLYCAB","DIXON","JIOFIN","MAXHEALTH",
        "MANKIND","VEDL","NMDC","DLF","GODREJPROP","OBEROIRLTY",
        "PHOENIXLTD","MPHASIS","LTIM","PIIND","SRF","DEEPAKNTR",
        "TATAPOWER","NHPC","RECLTD","PFC","CGPOWER","SUZLON",
        "ABCAPITAL","MUTHOOTFIN","ICICIPRULI","MARICO","DABUR",
        "GODREJCP","PIDILITIND","HAVELLS","AMBUJACEM","SHREECEM",
        "BERGEPAINT","IDEA",
        
        # Mid & Small Cap
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
# STEP 2: Fetch stock info (sector, name) from Yahoo Finance
# ────────────────────────────────────────────────────────────────────────────

# Yahoo Finance sector → simpler display name
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
    """Get company name and sector from Yahoo Finance."""
    try:
        yf_symbol = f"{symbol}.NS"
        ticker = yf.Ticker(yf_symbol)
        info = ticker.info
        
        name = info.get("shortName") or info.get("longName") or symbol
        # Clean up common suffixes
        name = name.replace(" Limited", "").replace(" Ltd.", "").replace(" Ltd", "")
        name = name.strip()
        
        raw_sector = info.get("sector", "Other")
        sector = SECTOR_MAP.get(raw_sector, raw_sector)
        
        industry = info.get("industry", "")
        market_cap = info.get("marketCap", 0)
        
        return {
            "name": name,
            "sector": sector,
            "industry": industry,
            "market_cap": market_cap,
        }
    except Exception as e:
        return {
            "name": symbol,
            "sector": "Other",
            "industry": "",
            "market_cap": 0,
        }


# ────────────────────────────────────────────────────────────────────────────
# STEP 3: Calculate returns
# ────────────────────────────────────────────────────────────────────────────

def calculate_return(prices, days_ago):
    """Calculate % return from days_ago trading days to latest."""
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
# STEP 4: Main fetch logic
# ────────────────────────────────────────────────────────────────────────────

def fetch_all_data(symbols):
    """Fetch price data and stock info for all symbols."""
    
    yf_symbols = [f"{s}.NS" for s in symbols]
    
    print(f"\n{'='*60}")
    print(f"Fetching price data for {len(yf_symbols)} stocks...")
    print(f"{'='*60}\n")
    
    # Download all historical prices at once (fast)
    price_data = yf.download(
        tickers=yf_symbols,
        period="1y",
        progress=True,
        threads=True,
        group_by="ticker"
    )
    
    results = []
    errors = []
    total = len(symbols)
    
    print(f"\nProcessing individual stocks...")
    
    for idx, symbol in enumerate(symbols):
        yf_symbol = f"{symbol}.NS"
        
        try:
            # Get closing prices
            if len(yf_symbols) == 1:
                close = price_data["Close"].dropna()
            else:
                close = price_data[yf_symbol]["Close"].dropna()
            
            if len(close) < 5:
                errors.append(f"  ✗ {symbol}: insufficient data ({len(close)} days)")
                continue
            
            # Get stock info (name, sector) from Yahoo
            # Do this in batches to avoid rate limiting
            if idx % 50 == 0 and idx > 0:
                print(f"\n  [{idx}/{total}] Pausing briefly to avoid rate limits...")
                time.sleep(2)
            
            info = get_stock_info(symbol)
            
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
            
            # Replace None with 0
            for k in ["d1", "w1", "m1", "m3", "m6", "y1"]:
                if stock_data[k] is None:
                    stock_data[k] = 0
            
            results.append(stock_data)
            
            # Progress indicator
            status = f"1D:{stock_data['d1']:+.1f}% 1Y:{stock_data['y1']:+.1f}%"
            print(f"  ✓ [{idx+1}/{total}] {symbol}: {info['name']} ({info['sector']}) — {status}")
            
        except Exception as e:
            errors.append(f"  ✗ {symbol}: {str(e)[:80]}")
    
    print(f"\n{'='*60}")
    print(f"Successfully fetched: {len(results)} stocks")
    if errors:
        print(f"Failed: {len(errors)} stocks")
        for e in errors[:20]:
            print(e)
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more")
    print(f"{'='*60}")
    
    return results


def main():
    # Step 1: Get stock list
    symbols = fetch_nifty500_list()
    
    if not symbols:
        print("ERROR: Could not get any stock symbols.")
        sys.exit(1)
    
    print(f"\nGot {len(symbols)} stock symbols to process")
    
    # Step 2: Fetch all data
    results = fetch_all_data(symbols)
    
    if not results:
        print("\nERROR: No data fetched. Check internet connection.")
        sys.exit(1)
    
    # Step 3: Sort by market cap (largest first), then by symbol as tiebreaker
    results.sort(key=lambda x: (-(x.get("market_cap") or 0), x["symbol"]))
    
    # Step 4: Build output
    # Count sectors
    sector_counts = {}
    for s in results:
        sec = s["sector"]
        sector_counts[sec] = sector_counts.get(sec, 0) + 1
    
    output = {
        "meta": {
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "stock_count": len(results),
            "source": "Yahoo Finance via yfinance",
            "sectors": sector_counts,
        },
        "stocks": results,
    }
    
    # Step 5: Save
    output_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public", "data"
    )
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "stocks.json")
    
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✅ Data saved to {output_path}")
    print(f"   {len(results)} stocks | Updated: {output['meta']['updated_at']}")
    print(f"   Sectors: {sector_counts}")


if __name__ == "__main__":
    main()
