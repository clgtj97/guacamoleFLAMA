import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CoinGeko } from './coingeko';
import { CoinGekoDos } from './coingekoDos';
import { CoinGekoTres } from './coingekoTres';

// Use the same interfaces from runesRoute.tsx for consistency
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

interface RunesProps {
  initialRunes: RuneData[];
  initialExchanges: ExchangeData[];
  initialNetworks: NetworkData[];
  initialLiveData: LiveRunesData;
}

export function Runes({
  initialRunes,
  initialExchanges,
  initialNetworks,
  initialLiveData
}: RunesProps) {
  console.log('[Runes] Initial props received:', {
    initialRunes: initialRunes?.length,
    initialExchanges: initialExchanges?.length,
    initialNetworks: initialNetworks?.length,
    initialLiveData: {
      tokens: initialLiveData?.tokens?.length,
      tickers: initialLiveData?.tickers?.tickers?.length,
      candlesticks: initialLiveData?.candlesticks?.length
    }
  });
  // State management for the active view and mobile detection
  const [activeView, setActiveView] = useState('runes');
  const [isMobile, setIsMobile] = useState(false);
  
  // Use the initial data directly (no need for additional state)
  const [runesList, setRunesList] = useState<RuneData[]>(initialRunes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('[Runes] Current state:', {
    activeView,
    isMobile,
    runesList: runesList?.length,
    loading,
    error
  });

  // Only need to fetch runes data since other data comes from router
  const fetchRunes = async (sort = 'holders', limit = 10) => {
    console.log(`[Runes] fetchRunes called with sort=${sort}, limit=${limit}`);

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://open-api.unisat.io/v1/indexer/runes/info-list?sort=${sort}&complete=no&start=0&limit=${limit}`,
        { headers: { 'accept': 'application/json' } }
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.code !== 0) throw new Error(data.msg || 'API returned non-zero code');
      
      const newRunes = data.data.detail.map((rune: any) => ({
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
      
      console.log('[Runes] Transformed runes data:', newRunes);
      setRunesList(newRunes);
    } catch (err) {
      console.error('[Runes] Error fetching runes:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      console.log('[Runes] Fetch completed. Current runesList:', runesList);
    }
  };

  const makeItRain = () => {
    const rainContainer = document.querySelector('.runes-rain-container');
    if (!rainContainer) return;
    rainContainer.innerHTML = '';

    let increment = 0;
    let drops = "";

    while (increment < 100) {
      const randoHundo = Math.floor(Math.random() * 98 + 1);
      const randoFiver = Math.floor(Math.random() * 4 + 2);
      increment += randoFiver;

      drops += `
        <div class="runes-drop" 
          style="
            left: ${increment}%;
            bottom: ${randoFiver * 2 + 100}%;
            animation-delay: 0.${randoHundo}s;
            animation-duration: 1.${randoHundo}s;
            font-size: ${Math.floor(Math.random() * 10 + 20)}px;
            color: #f2a900;
            text-shadow: 0 0 5px #f2a900;
          "
        >₿</div>
      `;
    }

    rainContainer.innerHTML = drops;
  };

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    makeItRain();
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'linear-gradient(to bottom, #202020, #111119)'
    }}>
      {/* Rain container */}
      <div className="runes-rain-container" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}></div>

      {/* Content container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          color: '#f2a900',
          textShadow: '0 0 10px #f2a900',
          textAlign: 'center',
          width: isMobile ? '95%' : '80%',
          maxWidth: '800px'
        }}
      >
        <div style={{
          fontSize: isMobile ? '1.8rem' : '2.5rem',
          marginBottom: isMobile ? '1rem' : '2rem',
          pointerEvents: 'none'
        }}>
          RUNES ARE LUCKY!
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '10px',
          padding: isMobile ? '1rem' : '1.5rem',
          maxHeight: isMobile ? '80vh' : '70vh',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#f2a900 transparent'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: isMobile ? '0.5rem' : 0
          }}>
            <h3 style={{ margin: 0 }}>
              {activeView === 'runes' ? 'Top Runes' : 
               activeView === 'coingecko' ? 'Networks' : 
               activeView === 'coingeckodos' ? 'Exchanges' : 'Top Runes LIVE'}
            </h3>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              justifyContent: isMobile ? 'center' : 'flex-end'
            }}>
              {activeView === 'runes' && (
                <>
                  <button
                    onClick={() => fetchRunes('holders', 10)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #f2a900',
                      color: '#f2a900',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: isMobile ? '0.8rem' : 'inherit'
                    }}
                  >
                    By Holders
                  </button>
                  <button 
                    onClick={() => fetchRunes('transactions', 10)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #f2a900',
                      color: '#f2a900',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: isMobile ? '0.8rem' : 'inherit'
                    }}
                  >
                    By Activity
                  </button>
                </>
              )}
              <button 
                onClick={() => setActiveView('runes')}
                style={{
                  background: activeView === 'runes' ? 'rgba(242, 169, 0, 0.2)' : 'transparent',
                  border: '1px solid #f2a900',
                  color: '#f2a900',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.8rem' : 'inherit'
                }}
              >
                Runes
              </button>
              <button 
                onClick={() => setActiveView('coingecko')}
                style={{
                  background: activeView === 'coingecko' ? 'rgba(242, 169, 0, 0.2)' : 'transparent',
                  border: '1px solid #f2a900',
                  color: '#f2a900',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.8rem' : 'inherit'
                }}
              >
                Networks
              </button>
              <button 
                onClick={() => setActiveView('coingeckodos')}
                style={{
                  background: activeView === 'coingeckodos' ? 'rgba(242, 169, 0, 0.2)' : 'transparent',
                  border: '1px solid #f2a900',
                  color: '#f2a900',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.8rem' : 'inherit'
                }}
              >
                Exchanges
              </button>
              <button 
                onClick={() => setActiveView('coingeckotres')}
                style={{
                  background: activeView === 'coingeckotres' ? 'rgba(242, 169, 0, 0.2)' : 'transparent',
                  border: '1px solid #f2a900',
                  color: '#f2a900',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.8rem' : 'inherit'
                }}
              >
                Top LIVE 
              </button>
            </div>
          </div>
              
          {loading ? (
            <div style={{ 
              color: '#f2a900', 
              textAlign: 'center',
              padding: '2rem'
            }}>
              Loading data...
            </div>
          ) : error ? (
            <div style={{ 
              color: '#ff5555', 
              textAlign: 'center',
              padding: '2rem'
            }}>
              Error: {error}
              <button 
                onClick={() => fetchRunes('holders', 10)}
                style={{
                  background: 'transparent',
                  border: '1px solid #f2a900',
                  color: '#f2a900',
                  padding: '0.5rem 1rem',
                  marginTop: '1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'block',
                  margin: '1rem auto 0'
                }}
              >
                Retry
              </button>
            </div>
          ) : activeView === 'coingecko' ? (
            <CoinGeko 
              initialData={initialNetworks} 
              loading={loading}
              error={error}
            />
          ) : activeView === 'coingeckodos' ? (
            <CoinGekoDos 
              initialData={initialExchanges}
              loading={loading}
              error={error}
            />
          ) : activeView === 'coingeckotres' ? (
            <CoinGekoTres 
              initialData={initialLiveData}
              loading={loading}
              error={error}
            />
          ) : runesList.length === 0 ? (
            <div style={{ 
              color: '#f2a900', 
              textAlign: 'center',
              padding: '2rem'
            }}>
              No runes found
            </div>
          ) : isMobile ? (
            // Mobile card view
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {runesList.map((rune) => (
                <div key={rune.id} style={{
                  background: 'rgba(15, 15, 15, 0.7)',
                  borderRadius: '8px',
                  padding: '1rem',
                  border: '1px solid rgba(242, 169, 0, 0.3)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{rune.name}</div>
                    <div>{BigInt(rune.supply).toLocaleString()} {rune.symbol}</div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                    opacity: 0.8
                  }}>
                    <div>Holders: {rune.holders.toLocaleString()}</div>
                    <div>Created: {rune.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop table view
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(242, 169, 0, 0.5)' }}>
                  <th style={{ padding: '0.5rem 0' }}>Rune</th>
                  <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Holders</th>
                  <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Supply</th>
                </tr>
              </thead>
              <tbody>
                {runesList.map((rune) => (
                  <tr 
                    key={rune.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(242, 169, 0, 0.2)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      ':hover': { background: 'rgba(242, 169, 0, 0.1)' }
                    }}
                  >
                    <td style={{ padding: '0.8rem 0' }}>
                      <div style={{ fontWeight: 'bold' }}>{rune.name}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        Created: {rune.timestamp}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.8rem 0' }}>
                      {rune.holders.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.8rem 0' }}>
                      {BigInt(rune.supply).toLocaleString()} {rune.symbol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}