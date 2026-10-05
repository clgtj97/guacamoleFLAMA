import React, { useEffect, useState } from 'react';

export function CoinGekoDos() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/exchanges', {
          headers: { 
            'accept': 'application/json',
            'x-cg-demo-api-key': import.meta.env.REACT_APP_COINGECKO_API_KEY || ''
          }
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        setExchanges(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExchanges();
  }, []);

  const filteredExchanges = exchanges.filter(exchange => 
    exchange.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    exchange.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-32 text-[#f2a900]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f2a900]"></div>
      <span className="ml-3">Loading exchanges...</span>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-900/20 border-l-4 border-red-500 text-red-400">
      <p className="font-bold">Error</p>
      <p>{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 bg-transparent border border-[#f2a900] text-[#f2a900] rounded hover:bg-[#f2a900]/10 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="relative z-10 max-w-6xl mx-auto">
      <div className="bg-black/70 rounded-xl p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#f2a900] scrollbar-track-transparent">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="text-xl font-bold text-[#f2a900]">Top Exchanges ({exchanges.length})</h3>
          <input
            type="text"
            placeholder="Search exchanges..."
            className="px-4 py-2 bg-black/50 border border-[#f2a900]/30 rounded-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#f2a900]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#f2a900]/50">
                <th className="pb-2 text-left text-[#f2a900] font-medium">Exchange</th>
                <th className="pb-2 text-left text-[#f2a900] font-medium">Established</th>
                <th className="pb-2 text-left text-[#f2a900] font-medium">Trust Score</th>
                <th className="pb-2 text-left text-[#f2a900] font-medium">24h Volume (BTC)</th>
                <th className="pb-2 text-left text-[#f2a900] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExchanges.map((exchange) => (
                <tr 
                  key={exchange.id} 
                  className="border-b border-[#f2a900]/20 hover:bg-[#f2a900]/10 transition-colors"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {exchange.image && (
                        <img 
                          src={exchange.image} 
                          alt={exchange.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-200">{exchange.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{exchange.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-400">
                    {exchange.year_established || 'N/A'}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      exchange.trust_score >= 9 ? 'bg-green-900/30 text-green-400' :
                      exchange.trust_score >= 7 ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {exchange.trust_score || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400 font-mono">
                    {exchange.trade_volume_24h_btc?.toLocaleString() || 'N/A'}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-3">
                      <a
                        href={exchange.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Visit
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExchanges.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No exchanges found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}