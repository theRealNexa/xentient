import { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Search, TrendingUp, TrendingDown, Sparkles, ArrowUp, ArrowDown, Minus, ChevronDown } from 'lucide-react';
//import logoImage from '../imports/xentinelLogo.png';

// Mock stock data
const mockStockData = {
  "change": 0,
  "changePercent": 0,
  "chartData": [
    {
      "id": 1,
      "price": 0,
      "time": "15 01:00"
    },
    {
      "id": 2,
      "price": 0,
      "time": "15 01:01"
    },
    {
      "id": 3,
      "price": 0,
      "time": "15 01:02"
    },
    {
      "id": 4,
      "price": 0,
      "time": "15 01:03"
    },
    {
      "id": 5,
      "price": 0,
      "time": "15 01:04"
    },
    {
      "id": 6,
      "price": 0,
      "time": "15 01:05"
    },
    {
      "id": 7,
      "price": 0,
      "time": "15 01:06"
    },
    {
      "id": 8,
      "price": 0,
      "time": "15 01:07"
    },
    {
      "id": 9,
      "price": 0,
      "time": "15 01:08"
    },
    {
      "id": 10,
      "price": 0,
      "time": "15 01:09"
    }
  ],
  "currentPrice": 0,
  "high": 0,
  "low": 0,
  "name": "Bitcoin USD",
  "symbol": "BTC-USD",
  "volume": 0,
  "insights": []
};

interface TimeframeConfig {
  label: string;
  range: string;     // Total historical window to fetch
  interval: string;  // The size of each data bar/candle
}

const TIMEFRAME_OPTIONS: Record<string, TimeframeConfig> = {
  '1D': { label: 'Today', range: '1d', interval: '1m' },      // 1-minute bars (Default)
  '5D': { label: '5 Days', range: '5d', interval: '15m' },    // 15-minute bars
  '1W': { label: '1 Week', range: '7d', interval: '30m' },    // 30-minute bars
  '30D': { label: '30 Days', range: '30d', interval: '1h' },   // hourly bars
  '6M': { label: '6 Months', range: '6mo', interval: '4h' },   // 4-hourly bars
  '1Y': { label: '1 Year', range: '1y', interval: '1d' },    // daily bars
};

const StockChart = ({ data }: { data: typeof mockStockData.chartData }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; time: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Dynamic width based on data points - more data = wider chart
  const pointSpacing = 15; // pixels per data point
  const minChartWidth = 700;
  const chartWidth = Math.max(minChartWidth, data.length * pointSpacing);
  const chartHeight = 340;
  const padding = { top: 20, right: 20, bottom: 40, left: 0 };

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices) - 1;
  const maxPrice = Math.max(...prices) + 1;

  const xScale = (index: number) => (index / (data.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
  const yScale = (value: number) => chartHeight - padding.bottom - ((value - minPrice) / (maxPrice - minPrice)) * (chartHeight - padding.top - padding.bottom);

  const pathData = data.map((d, i) => {
    const x = xScale(i);
    const y = yScale(d.price);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - padding.left;
    const relativeX = Math.max(0, Math.min(x / (chartWidth - padding.left - padding.right), 1));
    const index = Math.round(relativeX * (data.length - 1));
    const point = data[index];
    if (point) {
      setTooltip({
        x: xScale(index),
        y: yScale(point.price),
        value: point.price,
        time: point.time
      });
    }
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={chartWidth}
        height={chartHeight}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        className="overflow-visible"
      >
        {/* X-axis */}
        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke="#374151"
          strokeWidth="1"
        />

        {/* X-axis labels */}
        {data.map((d, i) => {
          const labelInterval = Math.max(1, Math.floor(data.length / 15));
          if (i % labelInterval === 0 || i === data.length - 1) {
            return (
              <text
                key={`x-label-${i}`}
                x={xScale(i)}
                y={chartHeight - padding.bottom + 20}
                fill="#6b7280"
                fontSize="12"
                textAnchor="middle"
              >
                {d.time}
              </text>
            );
          }
          return null;
        })}

        {/* Line path */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tooltip cursor */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x}
              y1={padding.top}
              x2={tooltip.x}
              y2={chartHeight - padding.bottom}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={tooltip.x}
              cy={tooltip.y}
              r="5"
              fill="#3b82f6"
              stroke="#1a1f2e"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-[#1a1f2e] border border-gray-700 rounded-lg px-3 py-2 pointer-events-none"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 40}px`,
            transform: tooltip.x > chartWidth - 100 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="text-gray-400 text-xs">{tooltip.time}</div>
          <div className="text-white font-bold">${tooltip.value.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
};

const YAxisChart = ({ data }: { data: typeof mockStockData.chartData }) => {
  const chartHeight = 340;
  const padding = { top: 20, bottom: 40 };

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices) - 1;
  const maxPrice = Math.max(...prices) + 1;

  const yTicks = 5;
  const tickValues = Array.from({ length: yTicks }, (_, i) => {
    return minPrice + (maxPrice - minPrice) * (i / (yTicks - 1));
  });

  const yScale = (value: number) => chartHeight - padding.bottom - ((value - minPrice) / (maxPrice - minPrice)) * (chartHeight - padding.top - padding.bottom);

  return (
    <svg width={70} height={chartHeight}>
      {/* Y-axis line */}
      <line
        x1={60}
        y1={padding.top}
        x2={60}
        y2={chartHeight - padding.bottom}
        stroke="#374151"
        strokeWidth="1"
      />

      {/* Y-axis labels */}
      {tickValues.map((value, i) => (
        <text
          key={`y-tick-${i}`}
          x={55}
          y={yScale(value)}
          fill="#6b7280"
          fontSize="12"
          textAnchor="end"
          dominantBaseline="middle"
        >
          ${value.toFixed(0)}
        </text>
      ))}
    </svg>
  );
};

const assetSuggestions = [
  // --- ORIGINAL STOCKS ---
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },

  // --- ADDITIONAL TECH & LARGE CAP STOCKS ---
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'KO', name: 'The Coca-Cola Company' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation' },

  // --- ORIGINAL CRYPTO ---
  { symbol: 'BTC-USD', name: 'Bitcoin USD' },
  { symbol: 'ETH-USD', name: 'Ethereum USD' },
  { symbol: 'SOL-USD', name: 'Solana USD' },
  { symbol: 'XRP-USD', name: 'Ripple USD' },

  // --- ADDITIONAL CRYPTOCURRENCIES ---
  { symbol: 'BNB-USD', name: 'BNB USD' },
  { symbol: 'ADA-USD', name: 'Cardano USD' },
  { symbol: 'DOGE-USD', name: 'Dogecoin USD' },
  { symbol: 'DOT-USD', name: 'Polkadot USD' },
  { symbol: 'LINK-USD', name: 'Chainlink USD' },
  { symbol: 'AVAX-USD', name: 'Avalanche USD' },
  { symbol: 'MATIC-USD', name: 'Polygon USD' },
  { symbol: 'LTC-USD', name: 'Litecoin USD' },
  { symbol: 'UNI-USD', name: 'Uniswap USD' },
  { symbol: 'ATOM-USD', name: 'Cosmos USD' },

  // --- INDICES (Yahoo ^ Prefix) ---
  { symbol: '^GSPC', name: 'S&P 500 Index' },
  { symbol: '^DJI', name: 'Dow Jones Industrial Average' },
  { symbol: '^IXIC', name: 'NASDAQ Composite' },
  { symbol: '^RUT', name: 'Russell 2000 Index' },
  { symbol: '^VIX', name: 'CBOE Volatility Index' },
  { symbol: '^FTSE', name: 'FTSE 100 Index (UK)' },
  { symbol: '^N225', name: 'Nikkei 225 Index (Japan)' },
  { symbol: '^GDAXI', name: 'DAX Performance Index (Germany)' },
  { symbol: '^HSI', name: 'Hang Seng Index (Hong Kong)' },
  { symbol: '^FCHI', name: 'CAC 40 Index (France)' },

  // --- COMMODITIES (Yahoo =F Futures Suffix) ---
  { symbol: 'GC=F', name: 'Gold Futures' },
  { symbol: 'SI=F', name: 'Silver Futures' },
  { symbol: 'CL=F', name: 'Crude Oil WTI Futures' },
  { symbol: 'BZ=F', name: 'Brent Crude Oil Futures' },
  { symbol: 'NG=F', name: 'Natural Gas Futures' },
  { symbol: 'HG=F', name: 'Copper Futures' },
  { symbol: 'ZC=F', name: 'Corn Futures' },
  { symbol: 'ZW=F', name: 'Wheat Futures' },
  { symbol: 'KC=F', name: 'Coffee Futures' },
  { symbol: 'CC=F', name: 'Cocoa Futures' },

  // --- FOREX / CURRENCY PAIRS (Yahoo =X Suffix) ---
  { symbol: 'EURUSD=X', name: 'Euro / US Dollar' },
  { symbol: 'GBPUSD=X', name: 'British Pound / US Dollar' },
  { symbol: 'USDJPY=X', name: 'US Dollar / Japanese Yen' },
  { symbol: 'AUDUSD=X', name: 'Australian Dollar / US Dollar' },
  { symbol: 'USDCAD=X', name: 'US Dollar / Canadian Dollar' },
  { symbol: 'USDCHF=X', name: 'US Dollar / Swiss Franc' },
  { symbol: 'USDNGN=X', name: 'US Dollar / Nigerian Naira' },
  { symbol: 'EURGBP=X', name: 'Euro / British Pound' },
  { symbol: 'EURJPY=X', name: 'Euro / Japanese Yen' },
  { symbol: 'GBPJPY=X', name: 'British Pound / Japanese Yen' },

  // --- FIXED INCOME & BOND YIELDS ---
  { symbol: '^IRX', name: '13-Week Treasury Bill Yield' },
  { symbol: '^FVX', name: '5-Year Treasury Note Yield' },
  { symbol: '^TNX', name: '10-Year Treasury Note Yield' },
  { symbol: '^TYX', name: '30-Year Treasury Bond Yield' },

  // --- REAL ESTATE & EXCHANGE TRADED FUNDS (ETFs) ---
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq-100)' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
  { symbol: 'VNQ', name: 'Vanguard Real Estate ETF' },
  { symbol: 'GLD', name: 'SPDR Gold Shares' },
  { symbol: 'USO', name: 'United States Oil Fund' }
];

/*Number formatter for summarization(Volume) */
const formatVolume = (num: number) => {
  if (!num || isNaN(num)) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString(); // Fallback for small numbers
};

export default function App() {
  // All necessary state variables
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1D');
  const [currentAsset, setCurrentAsset] = useState<string>('BTC-USD'); // Default initial asset match
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState(assetSuggestions);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stockData, setStockData] = useState(mockStockData);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const isPositive = stockData.change >= 0;

  const [cachedInsights, setCachedInsights] = useState<any[]>([]);
  const [lastInsightUpdate, setLastInsightUpdate] = useState<number>(0);
  
  // Updated data fetching accepting dynamic range & interval
    //Also updated market insight analysis throttling logic based on time-elapsed since last update and whether the fetch is a background tick or user-initiated
  const fetchStock = async (symbol: string, range: string = '1d', interval: string = '1m', isBackgroundTick: boolean = false) => {
    try {
      if (!isBackgroundTick) {
        setCurrentAsset(symbol);
      } else {
        setIsAutoRefreshing(true);
      }

      const response = await fetch(
        `https://xentient-backend.onrender.com/stock?symbol=${symbol}&range=${range}&interval=${interval}`
      );
      const data = await response.json();
      if (data.status === "success") {
        setStockData(data.chart_data);
        setCachedInsights(data.insights);    
      }
      // Always update live chart prices and header data instantly (every 10 seconds)
      setStockData(data);

      // INSIGHT THROTTLING ENGINE
      const currentTime = Date.now();
      const oneMinutes = 1 * 60 * 1000; // 180,000 ms (Adjust to 5 * 60 * 1000 for 5 minutes)
      const timeSinceLastUpdate = currentTime - lastInsightUpdate;

      if (!isBackgroundTick || timeSinceLastUpdate >= oneMinutes || cachedInsights.length === 0) {
        console.log(`⏱️ Throttling Engine: Refreshing insights for ${symbol} (${range}/${interval})`);
        setCachedInsights(data.insights || []);
        setLastInsightUpdate(currentTime);
      } else {
        // Keep the current view completely locked to avoid visual layout thrashing
        console.log(`🔒 Throttling Engine: Holding cached insights. Next update in ${Math.round((oneMinutes - timeSinceLastUpdate) / 1000)}s`);
      }

      if (!isBackgroundTick) {
        setSearchQuery('');
      }
    } catch (error) {
      console.error("Live streaming pipeline error:", error);
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  // Initial App Load (Fetches default BTC-USD on 1D / 1m interval)
  // Live Trading Polling Loop Engine
  useEffect(() => {
    // 1. Immediately fetch fresh data on mount or when asset/timeframe parameters change
    const activeConfig = TIMEFRAME_OPTIONS[selectedTimeframe];
    fetchStock(currentAsset, activeConfig.range, activeConfig.interval);

    // Live interval loop to fetch data every 10 seconds (10000ms)
    // Value based on API limitations (e.g., 5000ms for 5 seconds)
    const liveIntervalId = setInterval(() => {
      console.log(`Live Ticker Ping: Refreshing data stream for ${currentAsset}...`);
      fetchStock(currentAsset, activeConfig.range, activeConfig.interval, true);
    }, 10000);

    // 3. CLEANUP ENGINE: Clear the interval completely when asset shifts or drop-down changes
    return () => {
      console.log(`Tearing down background live data stream for ${currentAsset}`);
      clearInterval(liveIntervalId);
    };
  }, [currentAsset, selectedTimeframe]); // Re-runs naturally when these change


  // Auto-scroll to the right (most recent data) on load or when data changes
  useEffect(() => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
    }
  }, [stockData.chartData, selectedTimeframe]); // <-- Changed timePeriod to selectedTimeframe

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-6 pb-4">
          {/* The Flex container manages the exact vertical gap between Icon and Brand Name */}
          <div className="flex flex-col items-center justify-center gap-3">
            <BrainCircuit className="w-9 h-9 text-blue-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />

            {/* Removed -mt-2 so the text sits naturally; well-gapped. */}
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Xentient
            </h1>
          </div>
          
          {/* Added mt-3 to perfectly mirror the gap-3 used above */}
          <p className="text-gray-400 text-sm mt-3 tracking-wide">
            Market intelligence in real time
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center pt-2 relative z-50">
          {/* Absolute Anchor Wrapper */}
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="Search asset symbol (e.g., AAPL, TSLA, BTC-USD, USDNGN=X)"
              value={searchQuery}
              
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);

                if (value.trim() === '') {
                  setFilteredSuggestions(assetSuggestions);
                  setShowSuggestions(false);
                  return;
                }

                const filtered = assetSuggestions.filter((asset) =>
                  asset.symbol.toLowerCase().includes(value.toLowerCase()) ||
                  asset.name.toLowerCase().includes(value.toLowerCase())
                );

                setFilteredSuggestions(filtered);
                setShowSuggestions(true);
              }}

              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  const cleanSymbol = searchQuery.toUpperCase();
                  setSelectedTimeframe('1D'); // Reset timeframe selector state to default
                  fetchStock(cleanSymbol, TIMEFRAME_OPTIONS['1D'].range, TIMEFRAME_OPTIONS['1D'].interval);
                  setShowSuggestions(false);
                }
              }}
              className="w-full bg-[#1a1f2e] border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />

            {/* Scrollable Floating Suggestions List */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-[#1a1f2e] border border-gray-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#475468 transparent'
                }}
              >
                {filteredSuggestions.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => {
                      setSelectedTimeframe('1D'); // Reset timeframe selector state to default
                      fetchStock(asset.symbol, TIMEFRAME_OPTIONS['1D'].range, TIMEFRAME_OPTIONS['1D'].interval);
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-[#0f1219] transition-all border-b border-gray-800 last:border-none flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {asset.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        {asset.name}
                      </div>
                    </div>
                    
                    {/* Context type indicator pill */}
                    <span className="text-[10px] tracking-wider font-bold bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                      {asset.symbol.includes('-USD') ? 'CRYPTO' : asset.symbol.includes('=X') ? 'FOREX' : 'STOCK'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stock Info Header */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-bold">{stockData.symbol}</h1>                                                    
                  
              {/* Live Trading Pulse Dot */}
              <div className="flex items-center justify-center ml-1" title="Live Market Stream Active">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAutoRefreshing ? 'bg-amber-400' : 'bg-green-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isAutoRefreshing ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                </span>
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase ml-1.5 hidden md:inline">
                  {isAutoRefreshing ? 'SYNCING' : 'LIVE'}
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">{stockData.name}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold">${stockData.currentPrice}</span>
              {isPositive ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
            <div className={`flex items-center justify-center gap-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              <span>{isPositive ? '+' : ''}{stockData.change}</span>
              <span>({isPositive ? '+' : ''}{stockData.changePercent}%)</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 md:p-6 hover:border-gray-700 transition-all">
            <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Current Price</p>
            <p className="text-lg md:text-2xl font-bold">${stockData.currentPrice}</p>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 md:p-6 hover:border-gray-700 transition-all">
            <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">High</p>
            <p className="text-lg md:text-2xl font-bold text-green-500">${stockData.high}</p>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 md:p-6 hover:border-gray-700 transition-all">
            <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Low</p>
            <p className="text-lg md:text-2xl font-bold text-red-500">${stockData.low}</p>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 md:p-6 hover:border-gray-700 transition-all cursor-help relative group"title={`Exact Volume: ${stockData.volume.toLocaleString()}`}>
            <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Volume</p>
            <p className="text-lg md:text-2xl font-bold text-blue-400">{formatVolume(stockData.volume)}</p>
            {/* Custom CSS Hover Tooltip for a premium look on desktops */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0f1219] border border-gray-700 text-xs text-gray-200 px-3 py-1.5 rounded-md whitespace-nowrap shadow-xl z-30 pointer-events-none">{stockData.volume.toLocaleString()}</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold">Price Chart</h2>

            {/* Time Period Dropdown backed by Configuration Map */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-[#0f1219] border border-gray-700 rounded-lg px-3 py-2 text-sm hover:border-gray-600 transition-all"
              >
                {/* Display the active config's human-readable label */}
                <span>{TIMEFRAME_OPTIONS[selectedTimeframe].label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-[#0f1219] border border-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
                  {Object.entries(TIMEFRAME_OPTIONS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedTimeframe(key);
                        setIsDropdownOpen(false);
                        
                        // Re-run standard fetch with unchanged active asset, using updated configurations
                        fetchStock(currentAsset, config.range, config.interval);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[#1a1f2e] transition-colors ${
                        key === selectedTimeframe ? 'text-blue-400 bg-[#1a1f2e]' : 'text-gray-300'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex">
            {/* Fixed Y-Axis */}
            <div className="flex-shrink-0 bg-[#1a1f2e]">
              <YAxisChart data={stockData.chartData} />
            </div>

            {/* Scrollable Chart Area */}
            <div
              ref={chartScrollRef}
              className="flex-1 overflow-x-auto overflow-y-hidden"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: '#374151 transparent'
              }}
            >
              <StockChart data={stockData.chartData} />
            </div>
          </div>
        </div>

        {/* Market Insights Section */}
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold">Market Insights</h2>
            </div>
            
            {/* Elegant Timestamp Indicator showing the user when the analysis last updated */}
            {lastInsightUpdate > 0 && (
              <span className="text-[11px] text-gray-500 font-medium">
                Analyzed at {new Date(lastInsightUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Map directly through our throttled cache state */}
            {cachedInsights.map((insight: any) => {
              let CurrentIcon = Minus;
              let colorClass = 'text-gray-400 bg-gray-500/10 border-gray-500/20';

              if (insight.sentiment === 'bullish') {
                CurrentIcon = ArrowUp;
                colorClass = 'text-green-500 bg-green-500/10 border-green-500/20';
              } else if (insight.sentiment === 'bearish') {
                CurrentIcon = ArrowDown;
                colorClass = 'text-red-500 bg-red-500/10 border-red-500/20';
              }

              return (
                <div
                  key={insight.id}
                  className="bg-[#0f1219] border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${colorClass}`}>
                      <CurrentIcon className="w-4 h-4" />
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed flex-1">
                      {insight.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>    
      </div>
    </div>
  );
}