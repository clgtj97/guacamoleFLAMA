import { useState, useEffect } from 'react';
import { Orders } from './orders';

declare global {
  interface Window {
    unisat?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      getNetwork: () => Promise<string>;
      getVersion: () => Promise<string>;
      sendBitcoin: (address: string, amount: number) => Promise<string>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

type MintResult = {
  success: boolean;
  orderId?: string;
  payAddress?: string;
  amount?: number;
  txId?: string;
  error?: string;
};

export function Mint() {
  // Runes configuration
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
    devFeePercent: import.meta.env.VITE_UNISAT_MAINNET_API_KEY_DFEE, // 10% fee
    devAddress: import.meta.env.VITE_UNISAT_MAINNET_API_KEY_ADR, // Replace with your address
  };

  // Unisat API configuration
  const UNISAT_API_CONFIG = {
    mainnet: {
      baseUrl: 'https://open-api.unisat.io',
      apiKey: import.meta.env.VITE_UNISAT_MAINNET_API_KEY || '',
      mintEndpoint: '/v2/inscribe/order/create/runes-mint',
      statusEndpoint: '/v1/indexer/runes/status',
      orderEndpoint: '/v2/inscribe/order'
    },
    testnet: {
      baseUrl: 'https://open-api-testnet.unisat.io',
      apiKey: import.meta.env.VITE_UNISAT_TESTNET_API_KEY || '',
      mintEndpoint: '/v2/inscribe/order/create/runes-mint',
      statusEndpoint: '/v1/indexer/runes/status',
      orderEndpoint: '/v2/inscribe/order'
    }
  };

  const [unisatInstalled, setUnisatInstalled] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [mintAmount, setMintAmount] = useState<number>(1);
  const [feeRate, setFeeRate] = useState<number>(1);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);
  const [network, setNetwork] = useState<string>('');
  const [orderInfo, setOrderInfo] = useState<{
    orderId?: string;
    payAddress?: string;
    amount?: number;
    txId?: string;
  }>({});
  const [orderStatus, setOrderStatus] = useState<'pending' | 'paid' | 'minted' | 'expired'>('pending');
  const [paymentExpiry, setPaymentExpiry] = useState<number>(0);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Fetch current block height
  useEffect(() => {
    const fetchBlockHeight = async () => {
      try {
        const response = await fetch('https://blockstream.info/api/blocks/tip/height');
        const height = await response.json();
        setCurrentBlock(height);
      } catch (e) {
        console.error('Error fetching block height:', e);
      }
    };

    fetchBlockHeight();
    const interval = setInterval(fetchBlockHeight, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check and set up Unisat
  useEffect(() => {
    const setupUnisat = async () => {
      if (typeof window.unisat !== 'undefined') {
        setUnisatInstalled(true);
        try {
          const net = await window.unisat?.getNetwork?.();
          setNetwork(net);
          if (net === 'livenet' || net === 'testnet') {
            const accounts = await window.unisat?.getAccounts();
            if (accounts?.length) {
              setConnected(true);
              setAddress(accounts[0]);
            }
          }
        } catch (e) {
          console.error('Error setting up Unisat:', e);
        }
      }
    };

    setupUnisat();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setConnected(true);
        setShowManualInput(false);
      } else {
        setConnected(false);
        setAddress('');
      }
    };

    window.unisat?.on?.('accountsChanged', handleAccountsChanged);
    return () => {
      window.unisat?.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, []);

  // Track order status
  useEffect(() => {
    if (!orderInfo.orderId || !network) return;

    const config = network === 'livenet' 
      ? UNISAT_API_CONFIG.mainnet 
      : UNISAT_API_CONFIG.testnet;

    const checkOrderStatus = async () => {
      try {
        const response = await fetch(
          `${config.baseUrl}${config.orderEndpoint}/${orderInfo.orderId}`,
          { headers: { 'Authorization': `Bearer ${config.apiKey}` } }
        );
        
        const data = await response.json();
        console.log('Order Status Response:', {
          devFee: data.data.devFee,
          serviceFee: data.data.serviceFee,
          minerFee: data.data.minerFee
        });
        if (data.code === 0) {
          setOrderStatus(data.data.status);
          setPaymentExpiry(data.data.expireTime);
          
          if (data.data.txid && !orderInfo.txId) {
            setOrderInfo(prev => ({
              ...prev,
              txId: data.data.txid
            }));
          }
        }
      } catch (e) {
        console.error('Error checking order status:', e);
      }
    };

    checkOrderStatus();
    const interval = setInterval(checkOrderStatus, 30000);
    return () => clearInterval(interval);
  }, [orderInfo.orderId, network]);

  const connectWallet = async () => {
    try {
      const net = await window.unisat?.getNetwork();
      setNetwork(net);
      if (net !== 'livenet' && net !== 'testnet') {
        throw new Error('Please switch to Bitcoin Network');
      }
      const accounts = await window.unisat?.requestAccounts();
      if (accounts?.length) {
        setConnected(true);
        setAddress(accounts[0]);
        setShowManualInput(false);
      }
    } catch (e) {
      console.error('Connection error:', e);
      setMintResult({ 
        success: false, 
        error: e instanceof Error ? e.message : 'Failed to connect wallet' 
      });
      if (isMobile) setShowManualInput(true);
    }
  };

  const handleManualAddressSubmit = () => {
    if (!manualAddress.trim()) {
      setMintResult({ success: false, error: 'Please enter an address' });
      return;
    }
    setAddress(manualAddress);
    setConnected(true);
  };

  const mintViaUnisatApi = async (): Promise<MintResult> => {
    const isMainnet = network === 'livenet';
    const config = isMainnet ? UNISAT_API_CONFIG.mainnet : UNISAT_API_CONFIG.testnet;
    
    try {
      const totalMintAmount = mintAmount * RUNES_CONFIG.amountPerMint;
      const devFee = Math.floor((totalMintAmount * RUNES_CONFIG.devFeePercent) / 100);
  
      console.log('Sending to API:', {
        receiveAddress: address,
        feeRate: feeRate,
        outputValue: 546,
        runeid: RUNES_CONFIG.runeId,
        count: mintAmount,
        devAddress: RUNES_CONFIG.devAddress,  // ← This was missing!
        devFee: RUNES_CONFIG.devFeePercent                       // ← This was missing!
      });
  
      const response = await fetch(`${config.baseUrl}${config.mintEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          receiveAddress: address,
          feeRate: feeRate,
          outputValue: 546,
          runeid: RUNES_CONFIG.runeId,
          count: mintAmount,
          devAddress: RUNES_CONFIG.devAddress,  // ← Now included
          devFee: devFee                        // ← Now included
          // memo: `Dev fee: ${devFee} ${RUNES_CONFIG.apiTicker}` // Optional
        })
      });
  
      const data = await response.json();
      console.log('API Response:', data);  // ← Debug the response
  
      if (data.code !== 0) throw new Error(data.msg);
      
      return { 
        success: true,
        orderId: data.data.orderId,
        payAddress: data.data.payAddress,
        amount: data.data.amount
      };
    } catch (e) {
      console.error('API Error:', e);
      return { 
        success: false, 
        error: e instanceof Error ? e.message : 'Minting failed' 
      };
    }
  };

  const handlePayWithUnisat = async () => {
    if (!window.unisat || !orderInfo.payAddress || !orderInfo.amount) return;
    
    try {
      const txid = await window.unisat.sendBitcoin(
        orderInfo.payAddress,
        orderInfo.amount
      );
      console.log('Payment sent:', txid);
      setOrderStatus('paid');
    } catch (e) {
      console.error('Payment failed:', e);
      setMintResult({
        success: false,
        error: 'Payment was cancelled or failed'
      });
    }
  };

  const handleMint = async () => {
    if (!address) return;
    
    setIsMinting(true);
    setMintResult(null);
    setOrderInfo({});
    setOrderStatus('pending');
    
    try {
      if (!currentBlock) throw new Error('Block height unknown');
      if (currentBlock < RUNES_CONFIG.startBlock) throw new Error('Minting not started');
      if (currentBlock > RUNES_CONFIG.endBlock) throw new Error('Minting ended');

      const result = await mintViaUnisatApi();
      
      if (result.success) {
        setMintResult(result);
        setOrderInfo({
          orderId: result.orderId,
          payAddress: result.payAddress,
          amount: result.amount
        });
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      const error = e as Error;
      console.error('[RunesMint] Error:', error);
      setMintResult({
        success: false,
        error: error.message.includes('User rejected') 
          ? 'Transaction was cancelled' 
          : error.message
      });
    } finally {
      setIsMinting(false);
    }
  };

  const blocksRemaining = currentBlock ? RUNES_CONFIG.endBlock - currentBlock : null;
  const isMintActive = currentBlock && 
                      currentBlock >= RUNES_CONFIG.startBlock && 
                      currentBlock <= RUNES_CONFIG.endBlock;

  return (
    <main className="flex items-center justify-center min-h-screen py-8 bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg mx-4">
        <h1 className="text-2xl font-bold text-center mb-6">
          MINT: {RUNES_CONFIG.displayTicker} {RUNES_CONFIG.symbol}
        </h1>
        
        {network && (
          <div className={`mb-4 p-2 rounded text-center text-sm font-medium ${
            network === 'livenet' ? 'bg-green-100 text-green-800' : 
            network === 'testnet' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
          }`}>
            Network: {network.toUpperCase()}
            {!['livenet', 'testnet'].includes(network) && ' - Switch to Bitcoin Network'}
          </div>
        )}

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Start Block</p>
              <p className="font-mono">{RUNES_CONFIG.startBlock.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">End Block</p>
              <p className="font-mono">{RUNES_CONFIG.endBlock.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Current Block</p>
              <p className="font-mono">
                {currentBlock ? currentBlock.toLocaleString() : 'Loading...'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-mono">
                {!currentBlock ? 'Loading...' : 
                 currentBlock < RUNES_CONFIG.startBlock ? 'Not started' :
                 currentBlock > RUNES_CONFIG.endBlock ? 'Ended' : 
                 `Active (${blocksRemaining} blocks left)`}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Amount per Mint</p>
              <p className="font-mono">
                {RUNES_CONFIG.amountPerMint.toLocaleString()} {RUNES_CONFIG.symbol}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total Cap</p>
              <p className="font-mono">
                {RUNES_CONFIG.totalCap.toLocaleString()} {RUNES_CONFIG.symbol}
              </p>
            </div>
          </div>
        </div>
        
        {!unisatInstalled ? (
          <div className="text-center">
            <p className="mb-4">Unisat wallet is not installed</p>
            <a 
              href="https://unisat.io/download" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-block"
            >
              Install Unisat Wallet
            </a>
          </div>
        ) : !connected ? (
          <div className="text-center space-y-4">
            {!showManualInput ? (
              <>
                <button 
                  onClick={connectWallet}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full"
                >
                  Connect Wallet
                </button>
                <button
                  onClick={() => setShowManualInput(true)}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  Enter Address Manually
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="bc1q... or tb1q..."
                  className="w-full px-3 py-2 border rounded"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleManualAddressSubmit}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex-1"
                  >
                    Use This Address
                  </button>
                  <button
                    onClick={() => setShowManualInput(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    Back
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Note: Manual address entry skips validation. Double-check your address.
                </p>
              </div>
            )}
            {network && !['livenet', 'testnet'].includes(network) && (
              <p className="mt-2 text-red-500 text-sm">
                Please switch to Bitcoin Network
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Receiving to:</p>
              <p className="text-sm font-mono truncate">{address}</p>
              {!connected && (
                <p className="text-xs text-yellow-600">(Manually entered address)</p>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Mint Count:
              </label>
              <input
                type="number"
                id="amount"
                min={1}
                max={10}
                value={mintAmount}
                onChange={(e) => setMintAmount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex justify-between items-center">
              <label htmlFor="feeRate" className="block text-sm font-medium text-gray-700">
                Fee Rate (sat/vB):
              </label>
              <select
                id="feeRate"
                value={feeRate}
                onChange={(e) => setFeeRate(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value={1}>1 (Slow)</option>
                <option value={5}>5 (Medium)</option>
                <option value={10}>10 (Fast)</option>
                <option value={20}>20 (Urgent)</option>
              </select>
            </div>
            
            <div className="text-center py-2">
              <p className="text-sm">
                You will receive: <span className="font-bold">
                  {(mintAmount * RUNES_CONFIG.amountPerMint).toLocaleString()} {RUNES_CONFIG.symbol}
                </span>
              </p>
            </div>
            
            <button
              onClick={handleMint}
              disabled={isMinting || !isMintActive}
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors ${
                isMinting ? 'bg-gray-400' : 
                !isMintActive ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isMinting ? 'Minting...' : 
               !isMintActive ? (currentBlock ? 'Minting Not Active' : 'Loading...') : 
               `Mint ${mintAmount} Time${mintAmount > 1 ? 's' : ''}`}
            </button>
            
            {orderInfo.payAddress && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold mb-2">
                  {orderStatus === 'pending' && 'Payment Required'}
                  {orderStatus === 'paid' && 'Payment Received'}
                  {orderStatus === 'minted' && 'Minting Complete'}
                </h3>
                
                {orderStatus === 'pending' && ( <>
                    <p className="text-sm mb-1">
                      Send <strong>{orderInfo.amount} sats</strong> to:
                    </p>
                    <p className="font-mono text-sm break-all mb-3">
                      {orderInfo.payAddress}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(orderInfo.payAddress || '')}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                      >
                        Copy Address
                      </button>
                      {connected && (
                        <button
                          onClick={handlePayWithUnisat}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                        >
                          Pay with Unisat
                        </button>
                      )}
                    </div>
                    {paymentExpiry > 0 && (
                      <p className="text-xs text-orange-600 mt-2">
                        Expires in: {Math.max(0, Math.floor((paymentExpiry - Date.now()/1000)/60))} minutes
                      </p>
                    )}
                    <div className="mt-3 flex items-center">
                      <p className="mt-5 text-xs text-gray-600 mr-2">
                        Order ID: {orderInfo.orderId}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(orderInfo.orderId || '');
                          // Optional: Add temporary feedback that text was copied
                          const button = document.activeElement;
                          if (button instanceof HTMLElement) {
                            button.textContent = 'Copied!';
                            setTimeout(() => {
                              button.textContent = 'Copy';
                            }, 2000);
                          }
                        }}
                        className="mt-5 text-xs px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        Copy
                      </button>
                    </div>
                  </>
                )}
                
                {orderStatus === 'paid' && (
                  <div className="text-green-600">
                    <p>Payment received! Your runes are being minted...</p>
                  </div>
                )}
                
                {orderStatus === 'minted' && orderInfo.txId && (
                  <div className="text-green-600">
                    <p>Minting complete! Check your wallet.</p>
                    <button 
                      onClick={() => window.open(`https://mempool.space/tx/${orderInfo.txId}`)}
                      className="text-blue-500 text-sm mt-1"
                    >
                      View Transaction
                    </button>
                  </div>
                )}
              
              </div>
            )}

            {mintResult && !mintResult.success && (
              <div className="p-3 rounded bg-red-100 text-red-800">
                <p className="whitespace-pre-line">{mintResult.error}</p>
                {mintResult.error?.includes('rune') && (
                  <p className="mt-2 text-sm">Please verify your rune ID and ticker are correct</p>
                )}
              </div>
            )}
          </div>
        )}
        <Orders network={network} onConnectWallet={async () => {
          const accounts = await window.unisat.requestAccounts();
          return accounts[0];
        }} />
      </div>
    </main>
  );
}