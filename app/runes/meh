import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NetworkAttributes {
  name: string;
  native_token_symbol: string;
  coingecko_asset_platform_id?: string;
}

interface NetworkData {
  id: string;
  type: string;
  attributes: NetworkAttributes;
}

interface CoinGekoProps {
  initialData: NetworkData[];
  loading?: boolean;
  error?: string | null;
}

export function CoinGeko({ initialData, loading = false, error = null }: CoinGekoProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [networks, setNetworks] = useState<NetworkData[]>(initialData);
  const [sortConfig, setSortConfig] = useState<{ key: keyof NetworkAttributes; direction: 'asc' | 'desc' } | null>(null);

  // Update networks if initialData changes
  useEffect(() => {
    setNetworks(initialData);
  }, [initialData]);

  // Handle sorting
  const requestSort = (key: keyof NetworkAttributes) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting and filtering
  const filteredNetworks = React.useMemo(() => {
    let sortableNetworks = [...networks];
    
    // Filtering
    if (searchTerm) {
      sortableNetworks = sortableNetworks.filter(network => 
        network.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        network.attributes.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sorting
    if (sortConfig !== null) {
      sortableNetworks.sort((a, b) => {
        const aValue = a.attributes[sortConfig.key] || '';
        const bValue = b.attributes[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableNetworks;
  }, [networks, searchTerm, sortConfig]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f2a900]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border-l-4 border-red-500 text-red-400 rounded-lg">
        <p className="font-bold">Error Loading Networks</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!initialData || initialData.length === 0) {
    return (
      <div className="p-4 bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-400 rounded-lg">
        <p className="font-bold">No Network Data</p>
        <p>Network information could not be loaded</p>
      </div>
    );
  }

  const getSortIndicator = (key: keyof NetworkAttributes) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 max-w-6xl mx-auto"
    >
      <div className="bg-black/70 rounded-xl p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#f2a900] scrollbar-track-transparent">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-[#f2a900]">
            Supported Networks <span className="text-gray-400">({networks.length})</span>
          </h3>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search networks..."
              className="w-full px-4 py-2 bg-black/50 border border-[#f2a900]/30 rounded-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#f2a900]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#f2a900]/50">
                <th 
                  className="pb-3 text-left text-[#f2a900] font-medium cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Chain
                    <span className="text-xs">{getSortIndicator('name')}</span>
                  </div>
                </th>
                <th 
                  className="pb-3 text-left text-[#f2a900] font-medium cursor-pointer"
                  onClick={() => requestSort('native_token_symbol')}
                >
                  <div className="flex items-center gap-1">
                    Native Token
                    <span className="text-xs">{getSortIndicator('native_token_symbol')}</span>
                  </div>
                </th>
                <th 
                  className="pb-3 text-left text-[#f2a900] font-medium cursor-pointer"
                  onClick={() => requestSort('coingecko_asset_platform_id')}
                >
                  <div className="flex items-center gap-1">
                    CoinGecko ID
                    <span className="text-xs">{getSortIndicator('coingecko_asset_platform_id')}</span>
                  </div>
                </th>
                <th className="pb-3 text-left text-[#f2a900] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNetworks.map((network) => (
                <motion.tr 
                  key={network.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-[#f2a900]/20 hover:bg-[#f2a900]/10 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f2a900]/20 flex items-center justify-center">
                        <span className="text-[#f2a900] font-medium">
                          {network.attributes.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{network.attributes.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{network.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-gray-200">
                    {network.attributes.native_token_symbol || (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="py-4 text-gray-400 font-mono">
                    {network.attributes.coingecko_asset_platform_id || (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="py-4">
                    <div className="flex gap-3">
                      {network.attributes.coingecko_asset_platform_id && (
                        <a
                          href={`https://www.coingecko.com/en/coins/${network.attributes.coingecko_asset_platform_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 hover:text-blue-300 rounded-md transition-colors text-sm"
                        >
                          CoinGecko
                        </a>
                      )}
                      <a
                        href={`https://geckoterminal.com/${network.id}/pools`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 hover:text-green-300 rounded-md transition-colors text-sm"
                      >
                        Pools
                      </a>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredNetworks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-400"
          >
            No networks found matching "{searchTerm}"
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}