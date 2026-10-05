import { useLoaderData } from 'react-router-dom';
import { Runes } from '~/runes/runes';

// Rate limiting variables
let lastApiCallTime = 0;
const API_MIN_INTERVAL = 1000; // 1 second between calls (CoinGecko's free tier limit)

// Helper function to delay requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Consolidated Type Definitions
interface RuneData {
  id: string;
  name: string;
  holders: number;
  transactions: number;
  supply: string;
  minted: number;
  burned: number;
  timestamp: string;
  symbol: string;
}

interface ExchangeData {
  id: string;
  name: string;
  year_established?: number;
  country?: string;
  url: string;
  image: string;
  trust_score?: number;
}

interface NetworkData {
  id: string;
  type: string;
  attributes: {
    name: string;
    native_token_symbol: string;
  };
}

interface Token {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
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
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LiveRunesData {
  tokens: Token[];
  tickers: TickerData;
  candlesticks: CandlestickData[];
}

export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'holders';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Fetch data with rate limiting and error handling
    const [runes, exchanges, networks, liveData] = await Promise.all([
      fetchRunesData(sort, limit),
      fetchExchangesData(),
      fetchNetworksData(),
      fetchLiveRunesData().catch(e => {
        console.warn("Failed to fetch live data, using empty fallback:", e.message);
        return {
          tokens: [],
          tickers: { tickers: [], name: 'Bitcoin' },
          candlesticks: []
        } as LiveRunesData;
      })
    ]);

    return { runes, exchanges, networks, liveData };
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response(null, {
      status: 500,
      statusText: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// API Fetch Functions with rate limiting
async function fetchWithRateLimit<T>(fetchFn: () => Promise<T>, retries = 3): Promise<T> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;
  
  // Enforce rate limiting
  if (timeSinceLastCall < API_MIN_INTERVAL) {
    await delay(API_MIN_INTERVAL - timeSinceLastCall);
  }

  try {
    lastApiCallTime = Date.now();
    const response = await fetchFn();
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes('429') && retries > 0) {
      // Exponential backoff
      const delayTime = 1000 * (4 - retries); // 1s, 2s, 3s
      await delay(delayTime);
      return fetchWithRateLimit(fetchFn, retries - 1);
    }
    throw error;
  }
}

async function fetchRunesData(sort: string = 'holders', limit: number = 10): Promise<RuneData[]> {
  return fetchWithRateLimit(async () => {
    const response = await fetch(
      `https://open-api.unisat.io/v1/indexer/runes/info-list?sort=${sort}&complete=no&start=0&limit=${limit}`,
      { headers: { 'accept': 'application/json' } }
    );

    if (!response.ok) throw new Error(`Runes API error: ${response.status}`);
    const data = await response.json();
    if (data.code !== 0) throw new Error(data.msg || 'Runes API error');

    return data.data.detail.map((rune: any): RuneData => ({
      id: rune.runeid,
      name: rune.spacedRune || rune.rune,
      holders: rune.holders,
      transactions: rune.transactions,
      supply: rune.supply,
      minted: rune.mints,
      burned: rune.burned,
      timestamp: new Date(rune.timestamp * 1000).toLocaleDateString(),
      symbol: rune.symbol || '₿'
    }));
  });
}

async function fetchExchangesData(): Promise<ExchangeData[]> {
  return fetchWithRateLimit(async () => {
    const apiKey = process.env.COINGECKO_API_KEY || '';
    const response = await fetch('https://api.coingecko.com/api/v3/exchanges', {
      headers: { 
        'accept': 'application/json',
        'x-cg-demo-api-key': apiKey
      }
    });

    if (!response.ok) throw new Error(`Exchanges API error: ${response.status}`);
    return await response.json();
  });
}

async function fetchNetworksData(): Promise<NetworkData[]> {
  // Not using CoinGecko, so no rate limiting needed
  const response = await fetch('https://api.geckoterminal.com/api/v2/networks', {
    headers: { 'Accept': 'application/json;version=20230302' }
  });

  if (!response.ok) throw new Error(`Networks API error: ${response.status}`);
  const { data } = await response.json();
  return data.map((net: any): NetworkData => ({
    id: net.id,
    type: net.type,
    attributes: {
      name: net.attributes.name,
      native_token_symbol: net.attributes.native_token_symbol
    }
  }));
}

async function fetchLiveRunesData(): Promise<LiveRunesData> {
  const [tokens, tickers, candlesticks] = await Promise.all([
    fetchTopTokens().catch(() => []),
    fetchTickerData().catch(() => ({ tickers: [], name: 'Bitcoin' })),
    fetchDefaultCandlestickData().catch(() => [])
  ]);

  return {
    tokens,
    tickers,
    candlesticks
  };
}

async function fetchTopTokens(limit: number = 10): Promise<Token[]> {
  return fetchWithRateLimit(async () => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}`,
      { headers: { 'accept': 'application/json' } }
    );
    if (!response.ok) throw new Error(`Tokens API error: ${response.status}`);
    return await response.json();
  });
}

async function fetchTickerData(coinId: string = 'bitcoin'): Promise<TickerData> {
  return fetchWithRateLimit(async () => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/tickers`,
      { headers: { 'accept': 'application/json' } }
    );
    if (!response.ok) throw new Error(`Ticker API error: ${response.status}`);
    const data = await response.json();
    return {
      tickers: data.tickers,
      name: data.name
    };
  });
}

async function fetchDefaultCandlestickData(): Promise<CandlestickData[]> {
  return fetchWithRateLimit(async () => {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=30',
      { headers: { 'accept': 'application/json' } }
    );
    if (!response.ok) throw new Error(`Candlestick API error: ${response.status}`);
    const ohlcData: number[][] = await response.json();
    return ohlcData.map(([timestamp, open, high, low, close]) => ({
      time: Math.floor(timestamp / 1000),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close)
    })).filter(item => 
      !isNaN(item.time) && 
      !isNaN(item.open) && 
      !isNaN(item.high) && 
      !isNaN(item.low) && 
      !isNaN(item.close)
    );
  });
}

export default function RunesRoute() {
  const { runes, exchanges, networks, liveData } = useLoaderData() as {
    runes: RuneData[];
    exchanges: ExchangeData[];
    networks: NetworkData[];
    liveData: LiveRunesData;
  };

  return (
    <Runes 
      initialRunes={runes}
      initialExchanges={exchanges}
      initialNetworks={networks}
      initialLiveData={liveData}
    />
  );
}

export function ErrorBoundary() {
  return (
    <div className="error-container">
      <h2>We couldn't load the runes data</h2>
      <p>Please try again later or contact support if the problem persists.</p>
    </div>
  );
}