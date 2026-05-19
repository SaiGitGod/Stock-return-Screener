import json
import os
import sys
from datetime import datetime, timedelta
import yfinance as yf

STOCKS = {
    "RELIANCE": ("Reliance Industries", "Energy"),
    "TCS": ("Tata Consultancy Services", "IT"),
    "HDFCBANK": ("HDFC Bank", "Banking"),
    "INFY": ("Infosys", "IT"),
    "ICICIBANK": ("ICICI Bank", "Banking"),
    "HINDUNILVR": ("Hindustan Unilever", "FMCG"),
    "SBIN": ("State Bank of India", "Banking"),
    "BHARTIARTL": ("Bharti Airtel", "Telecom"),
    "ITC": ("ITC Limited", "FMCG"),
    "KOTAKBANK": ("Kotak Mahindra Bank", "Banking"),
    "LT": ("Larsen & Toubro", "Infra"),
    "AXISBANK": ("Axis Bank", "Banking"),
    "WIPRO": ("Wipro", "IT"),
    "HCLTECH": ("HCL Technologies", "IT"),
    "SUNPHARMA": ("Sun Pharma", "Pharma"),
    "MARUTI": ("Maruti Suzuki", "Auto"),
    "TATAMOTORS": ("Tata Motors", "Auto"),
    "NTPC": ("NTPC Ltd", "Energy"),
    "POWERGRID": ("Power Grid Corp", "Energy"),
    "ONGC": ("ONGC", "Energy"),
    "ULTRACEMCO": ("UltraTech Cement", "Cement"),
    "TITAN": ("Titan Company", "FMCG"),
    "ASIANPAINT": ("Asian Paints", "Chemicals"),
    "BAJFINANCE": ("Bajaj Finance", "Finance"),
    "BAJFINSV": ("Bajaj Finserv", "Finance"),
    "ADANIENT": ("Adani Enterprises", "Infra"),
    "ADANIPORTS": ("Adani Ports", "Infra"),
    "TECHM": ("Tech Mahindra", "IT"),
    "DRREDDY": ("Dr Reddy's Labs", "Pharma"),
    "CIPLA": ("Cipla", "Pharma"),
    "DIVISLAB": ("Divi's Laboratories", "Pharma"),
    "TATASTEEL": ("Tata Steel", "Metals"),
    "HINDALCO": ("Hindalco Industries", "Metals"),
    "JSWSTEEL": ("JSW Steel", "Metals"),
    "COALINDIA": ("Coal India", "Energy"),
    "BPCL": ("Bharat Petroleum", "Energy"),
    "GRASIM": ("Grasim Industries", "Cement"),
    "BRITANNIA": ("Britannia Industries", "FMCG"),
    "NESTLEIND": ("Nestle India", "FMCG"),
    "EICHERMOT": ("Eicher Motors", "Auto"),
    "HEROMOTOCO": ("Hero MotoCorp", "Auto"),
    "M&M": ("Mahindra & Mahindra", "Auto"),
    "BAJAJ-AUTO": ("Bajaj Auto", "Auto"),
    "TATACONSUM": ("Tata Consumer Products", "FMCG"),
    "INDUSINDBK": ("IndusInd Bank", "Banking"),
    "HDFCLIFE": ("HDFC Life Insurance", "Finance"),
    "SBILIFE": ("SBI Life Insurance", "Finance"),
    "APOLLOHOSP": ("Apollo Hospitals", "Pharma"),
    "BANKBARODA": ("Bank of Baroda", "Banking"),
    "PNB": ("Punjab National Bank", "Banking"),
    "CANBK": ("Canara Bank", "Banking"),
    "FEDERALBNK": ("Federal Bank", "Banking"),
    "IDFCFIRSTB": ("IDFC First Bank", "Banking"),
    "INDIGO": ("InterGlobe Aviation", "Infra"),
    "ZOMATO": ("Zomato", "IT"),
    "PAYTM": ("One97 Communications", "IT"),
    "DMART": ("Avenue Supermarts", "FMCG"),
    "NYKAA": ("FSN E-Commerce", "IT"),
    "HAL": ("Hindustan Aeronautics", "Infra"),
    "BEL": ("Bharat Electronics", "Infra"),
    "IRFC": ("Indian Railway Finance", "Finance"),
    "TRENT": ("Trent Ltd", "FMCG"),
    "PERSISTENT": ("Persistent Systems", "IT"),
    "COFORGE": ("Coforge", "IT"),
    "POLYCAB": ("Polycab India", "Infra"),
    "DIXON": ("Dixon Technologies", "IT"),
    "JIOFIN": ("Jio Financial Services", "Finance"),
    "MAXHEALTH": ("Max Healthcare", "Pharma"),
    "MANKIND": ("Mankind Pharma", "Pharma"),
    "VEDL": ("Vedanta", "Metals"),
    "NMDC": ("NMDC", "Metals"),
    "DLF": ("DLF", "Realty"),
    "GODREJPROP": ("Godrej Properties", "Realty"),
    "OBEROIRLTY": ("Oberoi Realty", "Realty"),
    "PHOENIXLTD": ("Phoenix Mills", "Realty"),
    "MPHASIS": ("Mphasis", "IT"),
    "LTIM": ("LTIMindtree", "IT"),
    "PIIND": ("PI Industries", "Chemicals"),
    "SRF": ("SRF Ltd", "Chemicals"),
    "DEEPAKNTR": ("Deepak Nitrite", "Chemicals"),
    "TATAPOWER": ("Tata Power", "Energy"),
    "NHPC": ("NHPC", "Energy"),
    "RECLTD": ("REC Ltd", "Finance"),
    "PFC": ("Power Finance Corp", "Finance"),
    "CGPOWER": ("CG Power & Industrial", "Infra"),
    "SUZLON": ("Suzlon Energy", "Energy"),
    "ABCAPITAL": ("Aditya Birla Capital", "Finance"),
    "MUTHOOTFIN": ("Muthoot Finance", "Finance"),
    "ICICIPRULI": ("ICICI Pru Life Insurance", "Finance"),
    "MARICO": ("Marico", "FMCG"),
    "DABUR": ("Dabur India", "FMCG"),
    "GODREJCP": ("Godrej Consumer Products", "FMCG"),
    "PIDILITIND": ("Pidilite Industries", "Chemicals"),
    "HAVELLS": ("Havells India", "Infra"),
    "AMBUJACEM": ("Ambuja Cements", "Cement"),
    "SHREECEM": ("Shree Cement", "Cement"),
    "BERGEPAINT": ("Berger Paints", "Chemicals"),
    "IDEA": ("Vodafone Idea", "Telecom"),
    "AARTIIND": ("Aarti Industries", "Chemicals"),
    "ABB": ("ABB India", "Infra"),
    "ABBOTINDIA": ("Abbott India", "Pharma"),
    "ACC": ("ACC Ltd", "Cement"),
    "ALKEM": ("Alkem Laboratories", "Pharma"),
    "AUROPHARMA": ("Aurobindo Pharma", "Pharma"),
    "BALKRISIND": ("Balkrishna Industries", "Auto"),
    "BANDHANBNK": ("Bandhan Bank", "Banking"),
    "BHEL": ("Bharat Heavy Electricals", "Infra"),
    "BIOCON": ("Biocon", "Pharma"),
    "CAMS": ("CAMS", "Finance"),
    "CHOLAFIN": ("Cholamandalam Finance", "Finance"),
    "COLPAL": ("Colgate-Palmolive", "FMCG"),
    "CONCOR": ("Container Corp", "Infra"),
    "CROMPTON": ("Crompton Greaves CE", "Infra"),
    "CUB": ("City Union Bank", "Banking"),
    "CUMMINSIND": ("Cummins India", "Infra"),
    "DALBHARAT": ("Dalmia Bharat", "Cement"),
    "ESCORTS": ("Escorts Kubota", "Auto"),
    "GAIL": ("GAIL India", "Energy"),
    "GLAND": ("Gland Pharma", "Pharma"),
    "GMRINFRA": ("GMR Airports Infra", "Infra"),
    "GUJGASLTD": ("Gujarat Gas", "Energy"),
    "HINDPETRO": ("Hindustan Petroleum", "Energy"),
    "HONAUT": ("Honeywell Automation", "Infra"),
    "IPCALAB": ("IPCA Laboratories", "Pharma"),
    "IRCTC": ("IRCTC", "Infra"),
    "JINDALSTEL": ("Jindal Steel & Power", "Metals"),
    "JUBLFOOD": ("Jubilant FoodWorks", "FMCG"),
    "LAURUSLABS": ("Laurus Labs", "Pharma"),
    "LICI": ("LIC of India", "Finance"),
    "LTTS": ("L&T Technology Services", "IT"),
    "LUPIN": ("Lupin", "Pharma"),
    "MANAPPURAM": ("Manappuram Finance", "Finance"),
    "MFSL": ("Max Financial Services", "Finance"),
    "MOTHERSON": ("Samvardhana Motherson", "Auto"),
    "MRF": ("MRF", "Auto"),
    "NAM-INDIA": ("Nippon Life India AMC", "Finance"),
    "NAUKRI": ("Info Edge (Naukri)", "IT"),
    "NAVINFLUOR": ("Navin Fluorine", "Chemicals"),
    "OFSS": ("Oracle Financial Services", "IT"),
    "PAGEIND": ("Page Industries", "Textiles"),
    "PETRONET": ("Petronet LNG", "Energy"),
    "RAMCOCEM": ("Ramco Cements", "Cement"),
    "SAIL": ("Steel Authority of India", "Metals"),
    "SIEMENS": ("Siemens", "Infra"),
    "TORNTPHARM": ("Torrent Pharma", "Pharma"),
    "TVSMOTOR": ("TVS Motor Company", "Auto"),
    "UBL": ("United Breweries", "FMCG"),
    "UNIONBANK": ("Union Bank of India", "Banking"),
    "UPL": ("UPL", "Chemicals"),
    "VOLTAS": ("Voltas", "Infra"),
    "ZYDUSLIFE": ("Zydus Lifesciences", "Pharma"),
    "ADANIGREEN": ("Adani Green Energy", "Energy"),
    "ADANIPOWER": ("Adani Power", "Energy"),
    "AFFLE": ("Affle India", "IT"),
    "ASTRAL": ("Astral Ltd", "Infra"),
    "ATUL": ("Atul Ltd", "Chemicals"),
    "BSOFT": ("Birlasoft", "IT"),
    "CANFINHOME": ("Can Fin Homes", "Finance"),
    "CDSL": ("CDSL", "Finance"),
    "CENTURYTEX": ("Century Textiles", "Textiles"),
    "CLEAN": ("Clean Science", "Chemicals"),
    "DELHIVERY": ("Delhivery", "Infra"),
    "DEVYANI": ("Devyani International", "FMCG"),
    "FACT": ("Fertilisers & Chemicals", "Chemicals"),
    "FIVESTAR": ("Five-Star Business Finance", "Finance"),
    "FORTIS": ("Fortis Healthcare", "Pharma"),
    "GRINDWELL": ("Grindwell Norton", "Infra"),
    "HAPPSTMNDS": ("Happiest Minds", "IT"),
    "IDFC": ("IDFC Ltd", "Finance"),
    "INDIANB": ("Indian Bank", "Banking"),
    "IOB": ("Indian Overseas Bank", "Banking"),
    "IOC": ("Indian Oil Corp", "Energy"),
    "JKCEMENT": ("JK Cement", "Cement"),
    "JSL": ("Jindal Stainless", "Metals"),
    "KALYANKJIL": ("Kalyan Jewellers", "FMCG"),
    "KEI": ("KEI Industries", "Infra"),
    "KPITTECH": ("KPIT Technologies", "IT"),
    "LICHSGFIN": ("LIC Housing Finance", "Finance"),
    "LLOYDSME": ("Lloyds Metals", "Metals"),
    "LODHA": ("Macrotech Developers", "Realty"),
    "LTFOODS": ("LT Foods", "FMCG"),
    "MCX": ("MCX", "Finance"),
    "NATCOPHARM": ("Natco Pharma", "Pharma"),
    "OLECTRA": ("Olectra Greentech", "Auto"),
    "PATANJALI": ("Patanjali Foods", "FMCG"),
    "PNBHOUSING": ("PNB Housing Finance", "Finance"),
    "POLICYBZR": ("PB Fintech", "Finance"),
    "PRESTIGE": ("Prestige Estates", "Realty"),
    "PVRINOX": ("PVR INOX", "Media"),
    "RVNL": ("Rail Vikas Nigam", "Infra"),
    "SBICARD": ("SBI Cards", "Finance"),
    "SONACOMS": ("Sona BLW Precision", "Auto"),
    "STARHEALTH": ("Star Health Insurance", "Finance"),
    "SUNTV": ("Sun TV Network", "Media"),
    "SUPREMEIND": ("Supreme Industries", "Infra"),
    "SYNGENE": ("Syngene International", "Pharma"),
    "TATACHEM": ("Tata Chemicals", "Chemicals"),
    "TATACOMM": ("Tata Communications", "Telecom"),
    "TATAELXSI": ("Tata Elxsi", "IT"),
    "TIINDIA": ("Tube Investments", "Auto"),
    "TORNTPOWER": ("Torrent Power", "Energy"),
    "TRIDENT": ("Trident Ltd", "Textiles"),
    "UNOMINDA": ("UNO Minda", "Auto"),
    "VBL": ("Varun Beverages", "FMCG"),
    "WHIRLPOOL": ("Whirlpool India", "FMCG"),
    "YESBANK": ("Yes Bank", "Banking"),
    "ZEEL": ("Zee Entertainment", "Media"),
}

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

def fetch_all_data():
    symbols_yf = [f"{sym}.NS" for sym in STOCKS.keys()]
    print(f"Fetching data for {len(symbols_yf)} stocks...")
    data = yf.download(tickers=symbols_yf, period="1y", progress=True, threads=True, group_by="ticker")
    results = []
    errors = []
    for symbol, (name, sector) in STOCKS.items():
        yf_symbol = f"{symbol}.NS"
        try:
            if len(symbols_yf) == 1:
                close = data["Close"].dropna()
            else:
                close = data[yf_symbol]["Close"].dropna()
            if len(close) < 5:
                errors.append(f"  x {symbol}: insufficient data")
                continue
            stock_data = {
                "symbol": symbol,
                "name": name,
                "sector": sector,
                "price": round(float(close.iloc[-1]), 2),
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
            print(f"  ok {symbol}: 1Y: {stock_data['y1']:+.1f}%")
        except Exception as e:
            errors.append(f"  x {symbol}: {str(e)[:80]}")
    print(f"\nDone: {len(results)} stocks fetched, {len(errors)} failed")
    return results

def main():
    results = fetch_all_data()
    if not results:
        print("ERROR: No data fetched.")
        sys.exit(1)
    results.sort(key=lambda x: x["symbol"])
    output = {
        "meta": {
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "stock_count": len(results),
            "source": "Yahoo Finance via yfinance",
        },
        "stocks": results,
    }
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "stocks.json")
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nSaved to {output_path}")
    print(f"{len(results)} stocks | {output['meta']['updated_at']}")

if __name__ == "__main__":
    main()
