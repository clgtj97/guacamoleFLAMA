import { useState, useEffect } from 'react';
import axios from 'axios';
import unisatlogo from './unilogo.png'

const RUNES_CONFIG = {
  displayTicker: 'I•AM•TOO•LUCKY',
  apiTicker: 'IAMTOOLUCKY',
  startBlock: 891983,
  endBlock: 897777,
  amountPerMint: 1000,
  totalCap: 7000000,
  symbol: '🍀',
  decimals: 0,
  runeId: '891983:2174',
  devFeePercent: import.meta.env.VITE_UNISAT_MAINNET_API_KEY_DFEE
};

const POLLING_INTERVALS = [
  { value: 10000, label: '10 sec' },
  { value: 30000, label: '30 sec' },
  { value: 60000, label: '1 min' },
  { value: 300000, label: '5 min' },
  { value: 600000, label: '10 min' },
];

interface OrderData {
  orderId: string;
  status: string;
  payAddress: string;
  receiveAddress: string;
  amount: number;
  paidAmount: number;
  outputValue: number;
  feeRate: number;
  minerFee: number;
  serviceFee: number;
  devFee: number;
  files: Array<{
    filename: string;
    inscriptionId: string;
    status: string;
  }>;
  count: number;
  pendingCount: number;
  unconfirmedCount: number;
  confirmedCount: number;
  createTime: number;
  refundTxid: string;
  refundAmount: number;
  refundFeeRate: number;
}

interface ApiResponse {
  code: number;
  msg: string;
  data: OrderData;
}

interface WalletData {
  address: string;
  isConnected: boolean;
}

interface TokenBalance {
  ticker: string;
  availableBalance: string;
  transferableBalance: string;
}

interface OrdersProps {
  network: string;
  onConnectWallet?: () => Promise<string>; // Returns address
}

export function Orders({ network, onConnectWallet }: OrdersProps) {
  // Order state
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(POLLING_INTERVALS[0].value);

  // Wallet state
  const [wallet, setWallet] = useState<WalletData>({
    address: '',
    isConnected: false
  });
  const [runesBalance, setRunesBalance] = useState<number>(0);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  const MIN_RUNES_BALANCE = 7777; // Minimum required Runes tokens

   // Define hasSufficientBalance as a computed value
   const hasSufficientBalance = runesBalance >= MIN_RUNES_BALANCE;

   const getApiConfig = () => {
    return network === 'livenet' 
      ? UNISAT_API_CONFIG.mainnet 
      : UNISAT_API_CONFIG.testnet;
  };

// Modified to use the prop function
const handleConnectWallet = async () => {
  if (!onConnectWallet) return;
  
  try {
    const address = await onConnectWallet();
    setWallet({
      address,
      isConnected: true
    });
    await checkRunesBalance(address);
  } catch (err) {
    setBalanceError(err instanceof Error ? err.message : 'Connection failed');
  }
};

  // Runes balance check
  const checkRunesBalance = async (address: string) => {
    setCheckingBalance(true);
    setBalanceError(null);
    
    try {
      // Method 1: Use the direct UniSat API endpoint
      try {
        const config = getApiConfig();
        const response = await axios.get(
          `${config.baseUrl}/v1/indexer/address/${address}/runes/${RUNES_CONFIG.runeId}/balance`,
          {
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Accept': 'application/json'
            },
            timeout: 10000
          }
        );

        if (response.data.code === 0 && response.data.data) {
          const balance = parseInt(response.data.data.amount);
          console.log('Found balance via direct API:', balance);
          setRunesBalance(balance);
          return;
        }
      } catch (apiError) {
        console.log('Direct API balance check failed:', apiError);
      }

      // Fallback Method 2: Use wallet's runes API if available
      if (window.unisat?.runes?.getBalances) {
        try {
          const balances = await window.unisat.runes.getBalances();
          const myRunes = balances.find(r => 
            r.runeid === RUNES_CONFIG.runeId || 
            r.rune?.toLowerCase().replace(/[•\s]/g, '') === RUNES_CONFIG.apiTicker.toLowerCase()
          );
          
          if (myRunes) {
            const balance = parseInt(myRunes.amount);
            setRunesBalance(balance);
            return;
          }
        } catch (walletError) {
          console.log('Wallet runes API failed:', walletError);
        }
      }

      // Fallback Method 3: Check inscription summary
      if (window.unisat?.getInscriptionSummary) {
        try {
          const balances = await window.unisat.getInscriptionSummary();
          const runesToken = balances.find((b: TokenBalance) => 
            b.ticker?.toLowerCase().replace(/[•\s]/g, '') === RUNES_CONFIG.apiTicker.toLowerCase()
          );
          
          if (runesToken) {
            const balance = (parseFloat(runesToken.availableBalance) || 0) + 
                          (parseFloat(runesToken.transferableBalance) || 0);
            setRunesBalance(balance);
            return;
          }
        } catch (summaryError) {
          console.log('Inscription summary failed:', summaryError);
        }
      }

      // If all methods fail
      setRunesBalance(0);
      setBalanceError('Could not verify balance. Showing basic features.');
    } catch (err) {
      console.error('Balance check error:', err);
      setBalanceError('Failed to check token balance');
      setRunesBalance(0);
    } finally {
      setCheckingBalance(false);
    }
  };

  // Update wallet connection to use new balance check
  const connectWallet = async () => {
    try {
      if (!window.unisat) {
        throw new Error('UniSat Wallet extension not detected');
      }

      const accounts = await window.unisat.requestAccounts();
      setWallet({
        address: accounts[0],
        isConnected: true
      });
      await checkRunesBalance(accounts[0]);
    } catch (err) {
      console.error('Wallet connection error:', err);
      setBalanceError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  // Order status fetch
  const fetchOrderStatus = async () => {
    if (!orderId.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const config = getApiConfig();
      const response = await axios.get<ApiResponse>(
        `${config.baseUrl}/v2/inscribe/order/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Accept': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        setOrderData(response.data.data);
      } else {
        throw new Error(response.data.msg || 'Failed to fetch order');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(axios.isAxiosError(err) 
        ? err.response?.data?.msg || err.message 
        : 'Failed to fetch order');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  // Polling effect
  useEffect(() => {
    if (!polling || !orderId) return;
    
    const interval = setInterval(fetchOrderStatus, selectedInterval);
    return () => clearInterval(interval);
  }, [polling, orderId, selectedInterval]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderStatus();
  };

const togglePolling = () => {
  if (!hasSufficientBalance) {
    setBalanceError(`You need at least ${MIN_RUNES_BALANCE} ${RUNES_CONFIG.displayTicker} to enable auto-refresh`);
    return;
  }
  setPolling(!polling);
};

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
      
<h2 className="text-lg font-semibold mb-4">Order Status Checker</h2>
      {/* Order lookup form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Enter Order ID"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      {orderData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-mono text-sm break-all">{orderData.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-medium ${
                orderData.status === 'pending' ? 'text-yellow-600' :
                orderData.status === 'paid' ? 'text-blue-600' :
                'text-green-600'
              }`}>
                {orderData.status.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-mono">{orderData.amount} sats</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="font-mono">{orderData.paidAmount} sats</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Pay Address</p>
                <p className="font-mono text-sm break-all">{orderData.payAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Receive Address</p>
                <p className="font-mono text-sm break-all">{orderData.receiveAddress}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Fees Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Miner Fee</p>
                <p className="font-mono">{orderData.minerFee} sats</p>
              </div>
              <div>
                <p className="text-gray-500">Service Fee</p>
                <p className="font-mono">{orderData.serviceFee} sats</p>
              </div>
              <div>
                <p className="text-green-600">Dev Fee</p>
                <p className="text-green-600 font-mono">0{RUNES_CONFIG.devFeePercent}.00%</p>
              </div>
            </div>
          </div>

          {orderData.files.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Files ({orderData.files.length})</h3>
              <ul className="space-y-2">
                {orderData.files.map((file, index) => (
                  <li key={index} className="text-sm">
                    <p className="font-medium">{file.filename}</p>
                    <p className="text-gray-500">Status: {file.status}</p>
                    {file.inscriptionId && (
                      <p className="font-mono text-xs break-all">
                        Inscription: {file.inscriptionId}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

<div className="flex justify-between items-center pt-4">
  <p className="text-xs text-gray-500">
    Created: {new Date(orderData.createTime).toLocaleString()}
  </p>
  
  <div className="flex flex-col items-end gap-1">
    {/* Conditional status text */}
    {hasSufficientBalance ? (
      <p className="text-green-500 text-xs font-medium">
        You're a <span className="font-bold">LUCKY MEMBER</span>
      </p>
    ) : (
      <p className="text-red-500 text-xs font-medium">
        ❌ Not enough LUCKY tokens to use MEMBER only perks 
      </p>
    )}

    {/* Button and interval selector in column */}
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={togglePolling}
        disabled={!hasSufficientBalance}
        className={`px-3 py-1 text-sm rounded ${
          polling 
            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        } ${
          !hasSufficientBalance ? 'opacity-50 cursor-not-allowed' : ''
        } transition-colors`}
      >
        {polling ? '✅ Auto-refresh ON' : '🔄 Enable auto-refresh'}
      </button>

      {/* Interval selector - only show when polling is enabled */}
      {polling && (
        <select
          value={selectedInterval}
          onChange={(e) => setSelectedInterval(Number(e.target.value))}
          className="text-xs p-1 border rounded bg-white w-full"
          disabled={!hasSufficientBalance}
        >
          {POLLING_INTERVALS.map((interval) => (
            <option key={interval.value} value={interval.value}>
              {interval.label}
            </option>
          ))}
        </select>
      )}
    </div>
  </div>
</div>
            </div>
            
      )}
      
      {/* Wallet connection section */}
      <div className="mt-6 p-3 bg-gray-100 rounded-md">
        <h2>Wallet Easy-Connect</h2>
        {!wallet.isConnected ? (
          <button
            onClick={handleConnectWallet}
            className="mt-2 px-2 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
         UniSat<img src={unisatlogo} alt="Logo" className="h-6 w-auto" /> 
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                Connected: <span className="font-mono">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
              </p>
              <button 
                onClick={() => checkRunesBalance(wallet.address)}
                className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                disabled={checkingBalance}
              >
                {checkingBalance ? 'Refreshing...' : 'Refresh Balance'}
              </button>
            </div>
            
            {checkingBalance ? (
              <p className="text-sm">Checking {RUNES_CONFIG.symbol} {RUNES_CONFIG.displayTicker} balance...</p>
            ) : (
              <p className="text-sm">
                {RUNES_CONFIG.symbol} {RUNES_CONFIG.displayTicker} balance: <span className="font-mono">{runesBalance.toLocaleString('en-US')}</span>
                {!hasSufficientBalance && (
                  <span className="ml-2 text-red-500">
                    (Minimum {MIN_RUNES_BALANCE} required)
                  </span>
                )}
              </p>
            )}
            {balanceError && (
              <p className="text-sm text-red-500">{balanceError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// API configuration
const UNISAT_API_CONFIG = {
  mainnet: {
    baseUrl: 'https://open-api.unisat.io',
    apiKey: import.meta.env.VITE_UNISAT_MAINNET_API_KEY || '',
  },
  testnet: {
    baseUrl: 'https://open-api-testnet.unisat.io',
    apiKey: import.meta.env.VITE_UNISAT_TESTNET_API_KEY || '',
  }
};