from flask import Flask, jsonify, request
import yfinance as yf
from flask_cors import CORS 

app = Flask(__name__)
CORS(app) 

@app.route("/")
def home():
    return "Stock API is running!"

@app.route("/stock", methods=['GET'])
def get_stock():
    symbol = request.args.get("symbol")
    range_param = request.args.get('range', '1d')  
    interval_param = request.args.get('interval', '1m')  
    
    if not symbol:
        return jsonify({"error": "Please provide a stock symbol"}), 400
        
    try:
        stock = yf.Ticker(symbol)
        chart_data = stock.history(period=range_param, interval=interval_param)
        # Fetch intraday metrics separately for the summary header panels
        today_data = stock.history(period="1d", interval="1m")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Fallback structure: If market is closed & today_data is empty, read summary stats from chart_data
    if chart_data.empty:
        return jsonify({"error": "Invalid stock symbol or no data found"}), 404
        
    # Use fallback data container if intraday market is offline
    summary_source = chart_data if today_data.empty else today_data

    # Match timezone normalization across dataframes safely
    chart_data.index = chart_data.index.tz_convert("Africa/Lagos")
    chart_data = chart_data.sort_index()
    
    if not today_data.empty:
        today_data.index = today_data.index.tz_convert("Africa/Lagos")
        today_data = today_data.sort_index()

    # Calculate highlights cleanly
    try:
        # Pull baseline financial figures safely from stock.info metadata
        previous_close = stock.info.get("previousClose")
        company_name = stock.info.get("longName", symbol.upper())
        
        # Pull live/last pricing numbers dynamically from our chosen data frames
        current_price = summary_source["Close"].iloc[-1]
        
        # If previousClose metadata is missing, calculate close delta from asset baseline data
        if not previous_close and len(summary_source) > 1:
            previous_close = summary_source["Close"].iloc[-2]
            
        if previous_close:
            change = current_price - previous_close
            change_percent = (change / previous_close) * 100
        else:
            change, change_percent = 0.0, 0.0

        today_high = summary_source["High"].max()
        today_low = summary_source["Low"].min()
        volume = int(summary_source["Volume"].sum())
        
    except Exception as calc_error:
        return jsonify({"error": f"Failed compiling highlight stats: {str(calc_error)}"}), 500

    # Format historical records to match chart canvas expectations
    formatted_chart_data = []
    for i, (index, row) in enumerate(chart_data.iterrows()):
        # Handle time-axis formatting changes based on range resolution
        time_format = "%b %d" if "d" in interval_param or "wk" in interval_param else "%d %H:%M"
        
        formatted_chart_data.append({
            "id": i + 1,
            "time": index.strftime(time_format),
            "price": round(float(row["Close"]), 2)
        })

        # ====================================================================
        # CONTEXT-AWARE MARKET INSIGHTS PROCESSING ENGINE
        # ====================================================================
        insights = []
        
        # 1. Dynamically scale parameters based on the requested interval
        is_macro = interval_param in ['1d', '5d', '1wk', '1mo']
        
        # Sensitivity thresholds scale up for macro intervals to filter out noise
        volatility_threshold_high = 5.0 if is_macro else 2.5
        volatility_threshold_low = 1.5 if is_macro else 0.5
        ma_percentage_band = 0.02 if is_macro else 0.005  # 2% deviation for daily bars vs 0.5% for minute bars
        
        # Terminology adaptive dictionary
        time_label = "macro trend structure" if is_macro else "intraday session"
        candle_label = "historical closing bar" if is_macro else "active candle interval"

        # 1. Range Position Analysis (Stays tied to the extreme limits of the requested view)
        summary_source = chart_data if today_data.empty else today_data
        high_limit = chart_data["High"].max() if is_macro else summary_source["High"].max()
        low_limit = chart_data["Low"].min() if is_macro else summary_source["Low"].min()
        
        if high_limit > low_limit:
            position_pct = ((current_price - low_limit) / (high_limit - low_limit)) * 100
            if position_pct > 85:
                insights.append({"id": 1, "text": f"Asset is trading near extreme upper bounds of this {time_label}.", "sentiment": "bullish"})
            elif position_pct < 15:
                insights.append({"id": 1, "text": f"Price is heavily depressed near structural support lows of this {time_label}.", "sentiment": "bearish"})
            else:
                insights.append({"id": 1, "text": f"Consolidating safely within established historical range boundaries.", "sentiment": "neutral"})
        else:
            insights.append({"id": 1, "text": "Awaiting initial price discovery matrix to establish range layout.", "sentiment": "neutral"})

        # 2. Moving Average Momentum (Context-Scaled Trend Checking)
        if len(chart_data) >= 10:
            recent_ma = chart_data["Close"].tail(10).mean()
            if current_price > recent_ma * (1 + ma_percentage_band):
                insights.append({"id": 2, "text": f"Price is exhibiting strong expansion above the 10-period {time_label} average.", "sentiment": "bullish"})
            elif current_price < recent_ma * (1 - ma_percentage_band):
                insights.append({"id": 2, "text": f"Sustained downward breakdown verified beneath key {time_label} moving averages.", "sentiment": "bearish"})
            else:
                insights.append({"id": 2, "text": f"Price action tracking steadily along its core {time_label} baseline.", "sentiment": "neutral"})
        else:
            insights.append({"id": 2, "text": "Insufficient dataset history to compute baseline trailing moving averages.", "sentiment": "neutral"})

        # 3. Volume Surge Tracker (Context-Scaled Liquidity Check)
        if len(chart_data) > 1:
            avg_volume = chart_data["Volume"].mean()
            current_vol = chart_data["Volume"].iloc[-1]
            volume_multiplier = 2.5 if is_macro else 1.5  # Require much higher volume flags for macro breakouts
            
            if current_vol > avg_volume * volume_multiplier:
                insights.append({"id": 3, "text": f"Major liquidity expansion: Trading volume is {round(current_vol/max(1, avg_volume), 1)}x above average for this interval.", "sentiment": "bullish" if change >= 0 else "bearish"})
            else:
                insights.append({"id": 3, "text": f"Volume signatures mirror normal baseline distribution for this {time_label}.", "sentiment": "neutral"})
        else:
            insights.append({"id": 3, "text": "Volume matrix establishing localized liquidity baselines.", "sentiment": "neutral"})

        # 4. Volatility Velocity Checker (Context-Scaled Percent Changes)
        abs_change = abs(change_percent)
        if abs_change > volatility_threshold_high:
            insights.append({"id": 4, "text": f"High velocity macro shifts: Total price displacement expanded by {round(change_percent, 2)}%.", "sentiment": "bullish" if change >= 0 else "bearish"})
        elif abs_change > volatility_threshold_low:
            insights.append({"id": 4, "text": f"Steady directional bias confirmed with a {round(change_percent, 2)}% net displacement.", "sentiment": "bullish" if change >= 0 else "bearish"})
        else:
            insights.append({"id": 4, "text": "Compressed volatility conditions; market participants maintaining tight pricing limits.", "sentiment": "neutral"})

        # 5. Last Candle Close Strength (Context-Scaled Candle Parsing)
        if len(chart_data) > 0:
            last_row = chart_data.iloc[-1]
            c_high, c_low, c_close = last_row["High"], last_row["Low"], last_row["Close"]
            if c_high > c_low:
                candle_score = (c_close - c_low) / (c_high - c_low)
                if candle_score > 0.80:
                    insights.append({"id": 5, "text": f"Strong bullish cluster dominant into the latest {candle_label} close.", "sentiment": "bullish"})
                elif candle_score < 0.20:
                    insights.append({"id": 5, "text": f"Aggressive institutional distribution weight into the latest {candle_label} close.", "sentiment": "bearish"})
                else:
                    insights.append({"id": 5, "text": f"Equilibrium maintained across the active horizontal trading bracket.", "sentiment": "neutral"})
            else:
                insights.append({"id": 5, "text": "Candle geometric layout compressed into a static matching baseline.", "sentiment": "neutral"})
        else:
            insights.append({"id": 5, "text": "Analyzing core data matrices to establish candlestick boundaries.", "sentiment": "neutral"})

        # 6. Global Session Sentiment Aggregate Summary
        bullish_count = sum(1 for ins in insights if ins["sentiment"] == "bullish")
        bearish_count = sum(1 for ins in insights if ins["sentiment"] == "bearish")
        
        if bullish_count > bearish_count:
            insights.append({"id": 6, "text": f"Aggregate framework registers a highly positive bias for this {time_label} window.", "sentiment": "bullish"})
        elif bearish_count > bullish_count:
            insights.append({"id": 6, "text": f"Aggregate structural data exposes prominent downside risks over this {time_label}.", "sentiment": "bearish"})
        else:
            insights.append({"id": 6, "text": "Market forces dynamically locked; awaiting structural breakout validation.", "sentiment": "neutral"})
    
    # ====================================================================
    return jsonify({
        "symbol": symbol.upper(),
        "name": company_name,
        "currentPrice": round(float(current_price), 2),
        "change": round(float(change), 2),
        "changePercent": round(float(change_percent), 2),
        "high": round(float(today_high), 2),
        "low": round(float(today_low), 2),
        "volume": volume,
        "chartData": formatted_chart_data,
        "insights": insights,  # <-- Added right here!
        "status": "success"
    })

if __name__ == "__main__":
    app.run(debug=True)