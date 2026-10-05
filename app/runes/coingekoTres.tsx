import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useDebounce } from 'use-debounce';

// Types
interface Token {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
    total_volume: number;
    ath: number;
    ath_date: string;
    market_data?: {
        ath?: {
        usd?: number;
        };
    };
    circulating_supply: number;
    sparkline_in_7d?: { price: number[] };
  }
interface Ticker {
  market: {
    name: string;
    identifier: string;
  };
  last: number;
  volume: number;
}

interface TickerData {
  tickers: Ticker[];
  name: string;
}

interface CandlestickData {
  time: number; // Changed to number (UNIX timestamp)
  open: number;
  high: number;
  low: number;
  close: number;
}

// Constants
const RUNE_TOKEN_IDS = [
  'dog-go-to-the-moon-rune',
  'lobo-the-wolf-pup-runes', 
  'rune-pups',
  'decentralized-runes',
  'meme-economics-rune',
  'billion-dollar-cat-runes',
  'satoshi-nakamoto-rune',
  'runecoin',
  'z-z-z-z-z-fehu-z-z-z-z-z'
];

const API_HEADERS = {
  'accept': 'application/json',
  'x-cg-demo-api-key': import.meta.env.VITE_COINGECKO_API_KEY || ''
};

// Components
const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f2a900]"></div>
);

const ErrorFallback = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="p-4 bg-red-900/20 border-l-4 border-red-500 text-red-400">
    <p className="font-bold">Error</p>
    <p>{error}</p>
    <button 
      onClick={onRetry}
      className="mt-2 px-4 py-2 bg-transparent border border-[#f2a900] text-[#f2a900] rounded hover:bg-[#f2a900]/10 transition-colors"
    >
      Retry
    </button>
  </div>
);

const ExchangeBadge = React.memo(({ name }: { name: string }) => (
  <span className="px-2 py-1 bg-[#f2a900]/20 text-[#f2a900] text-xs rounded-full flex items-center">
    <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
    {name}
  </span>
));

const TokenChart = React.memo(({ tokenId }: { tokenId: string }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90' | '365'>('30');
  const chartInstance = useRef<{ chart: any; series: any; resizeObserver: ResizeObserver } | null>(null);

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${tokenId}/ohlc?vs_currency=usd&days=${timeframe}`,
        { headers: API_HEADERS }
      );
      
      if (!response.ok) throw new Error(`Chart data error: ${response.status}`);
      
      const ohlcData = await response.json();
      
      // Validate and format data
      const formattedData = ohlcData
        .map(([timestamp, open, high, low, close]: number[]) => ({
          time: Math.floor(timestamp / 1000), // Convert to UNIX timestamp (seconds)
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close)
        }))
        .filter(item => 
          !isNaN(item.time) && 
          !isNaN(item.open) && 
          !isNaN(item.high) && 
          !isNaN(item.low) && 
          !isNaN(item.close)
        );
      
      if (formattedData.length === 0) {
        throw new Error('No valid chart data available');
      }
      
      setChartData(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
      console.error('Chart data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tokenId, timeframe]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetchChartData();
  }, [fetchChartData]);

  useEffect(() => {
    if (typeof window === 'undefined' || !chartContainerRef.current || chartData.length === 0) return;

    const initializeChart = async () => {
      try {
        const { createChart } = await import('lightweight-charts');
        
        // Clean up existing chart
        if (chartInstance.current) {
          chartInstance.current.resizeObserver.disconnect();
          chartInstance.current.chart.remove();
        }

        const chart = createChart(chartContainerRef.current!, {
          layout: {
            background: { type: 'solid', color: '#1e1e1e' },
            textColor: '#d9d9d9',
          },
          grid: {
            vertLines: { color: '#363c4e' },
            horzLines: { color: '#363c4e' },
          },
          width: chartContainerRef.current!.clientWidth,
          height: 400,
          localization: {
            timeFormatter: (time: number) => {
              return new Date(time * 1000).toLocaleDateString();
            },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
        });

        chart.priceScale('right').applyOptions({
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderDownColor: '#ef5350',
          borderUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          wickUpColor: '#26a69a',
        });

        candleSeries.setData(chartData);

        const resizeObserver = new ResizeObserver(entries => {
          chart.applyOptions({ width: entries[0].contentRect.width });
        });
        resizeObserver.observe(chartContainerRef.current!);

        chartInstance.current = { chart, series: candleSeries, resizeObserver };
      } catch (err) {
        console.error('Chart initialization error:', err);
        setError('Failed to initialize chart');
      }
    };

    initializeChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.resizeObserver.disconnect();
        chartInstance.current.chart.remove();
        chartInstance.current = null;
      }
    };
  }, [chartData]);

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <Spinner />
      <span className="ml-2">Loading chart data...</span>
    </div>
  );

  if (error) return (
    <div className="text-center p-4 text-red-400">
      <p>{error}</p>
      <button 
        onClick={fetchChartData}
        className="mt-2 px-3 py-1 text-sm bg-red-500/20 border border-red-500 rounded hover:bg-red-500/30"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="h-full w-full">
      <div ref={chartContainerRef} className="h-full w-full" />
      <div className="flex justify-center mt-2 space-x-2">
        {(['7', '30', '90', '365'] as const).map((days) => (
          <button
            key={days}
            onClick={() => setTimeframe(days)}
            className={`px-3 py-1 text-xs rounded ${
              timeframe === days
                ? 'bg-[#f2a900] text-black'
                : 'bg-[#f2a900]/20 text-[#f2a900] hover:bg-[#f2a900]/30'
            }`}
          >
            {days}d
          </button>
        ))}
      </div>
    </div>
  );
});

const TokenDetails = React.memo(({ token, tickers }: { token: Token, tickers: Ticker[] }) => {
  const topExchanges = useMemo(() => 
    tickers
      .filter(t => t.volume > 0 && !t.is_anomaly)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5), 
    [tickers]
  );

  return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 border border-[#f2a900]/30 rounded-lg">
            <div>
            <p className="text-sm text-[#f2a900]">Market Cap</p>
            <p className="font-mono">${token.market_cap?.toLocaleString() || 'N/A'}</p>
        </div>
        <div>
            <p className="text-sm text-[#f2a900]">24h Volume</p>
            <p className="font-mono">${token.total_volume?.toLocaleString() || 'N/A'}</p>
        </div>
        <div>
            <p className="text-sm text-[#f2a900]">ATH</p>
            <p className="font-mono">${token.ath?.toLocaleString() || 'N/A'}</p>
        </div>
        <div>
            <p className="text-sm text-[#f2a900]">ETH Price</p>
            <p className="font-mono">
                {tickers.reduce((highest, ticker) => {
                const current = ticker.converted_last?.eth || 0;
                return current > highest ? current : highest;
                }, 0)
                ? `${tickers.reduce((highest, ticker) => {
                    const current = ticker.converted_last?.eth || 0;
                    return current > highest ? current : highest;
                    }, 0).toLocaleString(undefined, {
                    minimumFractionDigits: 8,
                    maximumFractionDigits: 8
                    })} ETH`
                : 'N/A'
                }
            </p>
        </div>
        <div>
            <p className="text-sm text-[#f2a900]">Current Price</p>
            <p className="font-mono">
            ${token.current_price?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
            }) || 'N/A'}
            </p>
        </div>
        <div>
            <p className="text-sm text-[#f2a900]">Circulating Supply</p>
            <p className="font-mono">{token.circulating_supply?.toLocaleString() || 'N/A'}</p>
        </div>
    </div>
        
        <div className="mt-2">
          <p className="text-sm text-[#f2a900] mb-1">Top Exchanges:</p>
          <div className="flex flex-wrap gap-2">
            {topExchanges.length > 0 ? (
              topExchanges.map((ticker, index) => (
                <ExchangeBadge key={`${ticker.market.identifier}-${index}`} name={ticker.market.name} />
              ))
            ) : (
              <span className="text-gray-400 text-sm">No exchange data available</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="border border-[#f2a900]/30 rounded-lg p-4 h-[400px]">
        <TokenChart tokenId={token.id} />
      </div>
    </div>
  );
});

export function CoinGekoTres() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [expandedTokenId, setExpandedTokenId] = useState<string | null>(null);
  const [tickerData, setTickerData] = useState<Record<string, TickerData>>({});
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchRuneTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch market data first
      const marketResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${RUNE_TOKEN_IDS.join(',')}&sparkline=true`,
        { headers: API_HEADERS }
      );
      
      if (!marketResponse.ok) throw new Error(`Market data error: ${marketResponse.status}`);
      const marketData = await marketResponse.json();
      setTokens(marketData);

      // Then fetch ticker data sequentially to avoid rate limiting
      const tickerDataMap: Record<string, TickerData> = {};
      for (const id of RUNE_TOKEN_IDS) {
        try {
          const tickerResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${id}?tickers=true`,
            { headers: API_HEADERS }
          );
          
          if (!tickerResponse.ok) {
            console.warn(`Ticker error for ${id}: ${tickerResponse.status}`);
            continue;
          }
          
          tickerDataMap[id] = await tickerResponse.json();
          setTickerData(prev => ({ ...prev, [id]: tickerDataMap[id] }));
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`Error fetching tickers for ${id}:`, err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuneTokens();
  }, [fetchRuneTokens]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setExpandedTokenId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTokens = useMemo(() => 
    tokens.filter(token => 
      token.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
      token.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ),
    [tokens, debouncedSearchTerm]
  );

  const toggleExpand = useCallback((tokenId: string) => {
    setExpandedTokenId(prev => prev === tokenId ? null : tokenId);
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-32 text-[#f2a900]">
      <Spinner />
      <span className="ml-3">Loading Rune tokens...</span>
    </div>
  );

  if (error) return <ErrorFallback error={error} onRetry={fetchRuneTokens} />;

  return (
    <div className="relative z-10 max-w-6xl mx-auto" ref={tableRef}>
      <div className="bg-black/70 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="text-xl font-bold text-[#f2a900]">Rune Tokens ({tokens.length})</h3>
          <input
            type="text"
            placeholder="Search Runes..."
            className="px-4 py-2 bg-black/50 border border-[#f2a900]/30 rounded-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#f2a900]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Rune tokens"
          />
        </div>

        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#f2a900] scrollbar-track-transparent">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-black/70 z-10">
              <tr className="border-b border-[#f2a900]/50">
                <th className="pb-2 text-left text-[#f2a900] font-medium">Token</th>
                <th className="pb-2 text-left text-[#f2a900] font-medium">Price</th>
                <th className="pb-2 text-left text-[#f2a900] font-medium">24h Change</th>
                <th className="pb-2 text-left text-[#f2a900] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token) => (
                <React.Fragment key={token.id}>
                  <tr 
                    className={`border-b border-[#f2a900]/20 hover:bg-[#f2a900]/10 transition-colors cursor-pointer ${
                      expandedTokenId === token.id ? 'bg-[#f2a900]/10' : ''
                    }`}
                    onClick={() => toggleExpand(token.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleExpand(token.id)}
                    aria-expanded={expandedTokenId === token.id}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={token.image} 
                          alt={token.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://via.placeholder.com/32';
                          }}
                        />
                        <div>
                          <div className="font-medium text-gray-200">{token.name}</div>
                          <div className="text-xs text-gray-400 font-mono">
                            {token.symbol.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-200 font-mono">
                      <div className="flex items-center">
                        ${token.current_price?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6
                        })}
                        {token.price_change_percentage_24h >= 0 ? (
                          <svg className="w-4 h-4 ml-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 ml-1 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`font-mono flex items-center ${
                        token.price_change_percentage_24h >= 0 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {token.price_change_percentage_24h?.toFixed(2)}%
                        {token.price_change_percentage_24h >= 0 ? (
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-3">
                        <a
                          href={`https://www.coingecko.com/en/coins/${token.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`View ${token.name} on CoinGecko`}
                        >
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                  {expandedTokenId === token.id && (
                    <tr className="bg-black/50">
                      <td colSpan={4} className="px-4 py-3">
                        <TokenDetails 
                          token={token} 
                          tickers={tickerData[token.id]?.tickers || []} 
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No Rune tokens found matching "{debouncedSearchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}