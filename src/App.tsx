import { useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  WalletModalProvider,
  WalletMultiButton
} from "@solana/wallet-adapter-react-ui";
import {
  clusterApiUrl,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
  ComputeBudgetProgram
} from "@solana/web3.js";

// Only import Phantom wallet adapter
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

// Toast notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import "@solana/wallet-adapter-react-ui/styles.css";
import "./App.css";

// Constants
const AVAILABLE_FOR_PURCHASE = 800000000;
const SOLD_TOKENS = 520000000;
const PRICE_PER_TOKEN = 0.0375;
const TOKEN_AUTHORITY = new PublicKey("ACF5o8USHkcexBrbuTL1KFsDhL44qyC3a9L1euW23hGP");

interface TransactionHistory {
  txId: string;
  amount: number;
  cost: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function WalletContent() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet, connect, connected } = useWallet();
  const [amountToBuy, setAmountToBuy] = useState<number>(1000);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    const interval = setInterval(() => {
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(interval);
        return;
      }
      
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (value: number | undefined, decimals: number = 4): string => {
    if (value === undefined || isNaN(value)) return '0'.padEnd(decimals + 2, '.0');
    return value.toFixed(decimals);
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('transactionHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        const historyWithDates = parsedHistory.map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp)
        }));
        setTransactionHistory(historyWithDates);
      } catch (error) {
        console.error("Failed to parse transaction history:", error);
        toast.error("Failed to load transaction history");
      }
    }
  }, []);

  useEffect(() => {
    if (transactionHistory.length > 0) {
      localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
    }
  }, [transactionHistory]);

  useEffect(() => {
    async function checkSolBalance() {
      if (publicKey) {
        try {
          const balance = await connection.getBalance(publicKey);
          setSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error("Error checking balance:", error);
          toast.error("Failed to check balance");
        }
      }
    }
    
    const interval = setInterval(checkSolBalance, 15000);
    checkSolBalance();
    
    return () => clearInterval(interval);
  }, [connection, publicKey]);

  useEffect(() => {
    if (!wallet) return;

    const handleDisconnect = () => {
      toast.warning("Wallet disconnected");
    };

    wallet.adapter.on('disconnect', handleDisconnect);

    return () => {
      wallet.adapter.off('disconnect', handleDisconnect);
    };
  }, [wallet]);

  const reconnectWallet = async () => {
    toast.info("Reconnecting wallet...");
    try {
      await connect();
      toast.success("Wallet reconnected!");
      return true;
    } catch (error) {
      console.error("Reconnection failed:", error);
      toast.error("Failed to reconnect wallet");
      return false;
    }
  };

  const sendTransactionWithRetry = async (transaction: Transaction, maxAttempts = 3) => {
    let attempts = 0;
    let lastError: unknown;

    while (attempts < maxAttempts) {
      try {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey || undefined;

        const signature = await sendTransaction(transaction, connection);

        const newTx: TransactionHistory = {
          txId: signature,
          amount: amountToBuy,
          cost: PRICE_PER_TOKEN * amountToBuy,
          timestamp: new Date(),
          status: 'pending'
        };
        setTransactionHistory(prev => [newTx, ...prev]);
        setLastTransaction(signature);
        toast.info(`Transaction sent (${signature.slice(0, 6)}...)`);

        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');

        setTransactionHistory(prev => 
          prev.map(tx => 
            tx.txId === signature ? { ...tx, status: 'confirmed' } : tx
          )
        );
        
        return signature;
      } catch (error) {
        lastError = error;
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          if (isError(error) && (error.message.includes("disconnected") || error.message.includes("Not connected"))) {
            await reconnectWallet();
          }
        }
      }
    }
    throw lastError || new Error("Transaction failed after multiple attempts");
  };

  const buyTokens = async () => {
    if (!wallet || !publicKey) {
      toast.warning("Please connect your wallet first");
      return;
    }

    if (!connected) {
      const reconnected = await reconnectWallet();
      if (!reconnected) {
        toast.error("Wallet connection required");
        return;
      }
    }

    if (amountToBuy <= 0 || isNaN(amountToBuy)) {
      toast.error("Amount must be greater than zero");
      return;
    }

    if (!Number.isInteger(amountToBuy)) {
      toast.error("Amount must be an integer value");
      return;
    }

    const totalCost = PRICE_PER_TOKEN * amountToBuy;
    if (totalCost > (solBalance || 0)) {
      toast.error(`Insufficient balance. Needed: ${formatNumber(totalCost)} SOL`);
      return;
    }

    if (amountToBuy > AVAILABLE_FOR_PURCHASE) {
      toast.error(`Amount unavailable. Max: ${AVAILABLE_FOR_PURCHASE.toLocaleString()} tokens`);
      return;
    }

    setLoading(true);

    try {
      const solTransaction = new Transaction();
      
      solTransaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TOKEN_AUTHORITY,
          lamports: Math.floor(LAMPORTS_PER_SOL * totalCost),
        })
      );

      await sendTransactionWithRetry(solTransaction);
      
      toast.success(<div>
        <div>Payment successful!</div>
        <div style={{ fontSize: '0.9em', marginTop: '5px' }}>Tokens may take up to 24 hours to arrive</div>
      </div>);

      const newBalance = await connection.getBalance(publicKey) / LAMPORTS_PER_SOL;
      setSolBalance(newBalance);

    } catch (error: unknown) {
      console.error("Full error:", error);

      let errorMessage = "Transaction error";
      if (isError(error)) {
        if (error.message.includes("User rejected")) {
          errorMessage = "User rejected the transaction";
        } else if (error.message.includes("disconnected") || error.message.includes("Not connected")) {
          errorMessage = "Wallet disconnected. Please try again.";
        } else if (error.message.includes("Blockhash not found")) {
          errorMessage = "Transaction expired. Please try again.";
        }
      }

      toast.error(errorMessage);

      if (lastTransaction) {
        setTransactionHistory(prev => 
          prev.map(tx => 
            tx.txId === lastTransaction ? { ...tx, status: 'failed' } : tx
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const totalCost = PRICE_PER_TOKEN * amountToBuy;
  const progressPercentage = (SOLD_TOKENS / AVAILABLE_FOR_PURCHASE) * 100;

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-left">
          <h1 className="project-name">DeAgro</h1>
        </div>
          <h2 className="projectagx"> Presale AGX</h2>        
        <div className="header-right">
          <div className="token-info">
            <span className="token-name">AGX:</span>
            <span className="token-price">${PRICE_PER_TOKEN.toFixed(4)}</span>
            <p>/  next price: 0.075</p>          
          </div>
          <WalletMultiButton className="wallet-connect-button" />
        </div>
      </header>

      <main className="main-content">
        <div className="right-side">
          <section id="presale" className="section">
            <div className="presale-content modern-card">
              <div className="presale-header">
                <h2 className="presale-title">AGX Token Presale</h2>
              </div>

              <div className="countdown-row">
                <div className="countdown-modern">
                  <div className="timer-row">
                    <div className="timer-segment-modern">
                      <span className="timer-value">{timeLeft.days}</span>
                      <span className="timer-label">DAYS</span>
                    </div>
                    <div className="timer-segment-modern">
                      <span className="timer-value">{timeLeft.hours}</span>
                      <span className="timer-label">HOURS</span>
                    </div>
                    <div className="timer-segment-modern">
                      <span className="timer-value">{timeLeft.minutes}</span>
                      <span className="timer-label">MINUTES</span>
                    </div>
                    <div className="timer-segment-modern">
                      <span className="timer-value">{timeLeft.seconds}</span>
                      <span className="timer-label">SECONDS</span>
                    </div>
                  </div>
                </div>

                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
                  <span className="progress-text">{progressPercentage.toFixed(2)}% Complete</span>
                </div>
              </div>

              <div className="purchase-modern">
                <div className="amount-selector">
                  <label>SELECT AMOUNT (AGX):</label>
                  <div className="amount-input">
                    <input
                      type="number"
                      value={amountToBuy}
                      onChange={(e) => setAmountToBuy(Number(e.target.value))}
                      min={1000}
                      step={1000}
                    />
                  </div>
                </div>

                <div className="summary-modern">
                  <div className="summary-row">
                    <span>YOU WILL RECEIVE:</span>
                    <span>{amountToBuy.toLocaleString()} AGX</span>
                  </div>
                  <div className="summary-row">
                    <span>TOTAL COST:</span>
                    <span>{formatNumber(totalCost)} SOL</span>
                  </div>
                  <div className="summary-row">
                    <span>YOUR SOL BALANCE:</span>
                    <span>{formatNumber(solBalance)} SOL</span>
                  </div>
                  <div className="summary-row highlight">
                    <span>CURRENT BONUS:</span>
                    <span>+15% EXTRA TOKENS</span>
                  </div>
                </div>

                <button
                  className="buy-button-modern"
                  onClick={buyTokens}
                  disabled={loading || !connected || totalCost > solBalance}
                >
                  {loading ? (
                    <span className="spinner"></span>
                  ) : connected ? (
                    totalCost > solBalance ? "INSUFFICIENT SOL BALANCE" : "PURCHASE AGX TOKENS"
                  ) : (
                    "CONNECT WALLET TO PURCHASE"
                  )}
                </button>

                <div className="disclaimer">
                  <p>Tkens will be distributed after the presale concludes. Bonus tokens will be automatically credited.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Only use Phantom wallet adapter
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter()
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;