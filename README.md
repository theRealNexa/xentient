# xentient
Full-stack real-time asset visualization dashboard and automated market insights pipeline and platform.

Xentient features a highly responsive frontend combined with a Python-powered backend pipeline to deliver real-time stock and asset telemetry, featuring low-latency market charts and an intelligent insights throttling engine.

## 🚀 Core Features

*   **Real-Time Data Streaming:** Seamless background polling for live tick-by-tick market updates.
*   **Throttling Engine:** Optimized data fetching to balance live asset pricing with computational efficiency for text/insight generation.
*   **Responsive Visualization:** Smooth, interactive candlestick and historical charts tailored for deep-dive market analysis.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS
*   **Backend:** Python, Flask, yfinance
*   **State Management & Effects:** Custom React hooks and UI scroll anchoring locks

## 📦 Installation & Setup

### Backend (Flask)
1. Navigate to the backend directory.
2. Install dependencies: `pip install -r requirements.txt`
3. Start the server: `python app.py`

### Frontend (React)
1. Navigate to the frontend directory.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
