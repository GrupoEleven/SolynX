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

// Wallet imports
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { GlowWalletAdapter } from '@solana/wallet-adapter-glow';
import { BraveWalletAdapter } from '@solana/wallet-adapter-brave';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { MathWalletAdapter } from '@solana/wallet-adapter-mathwallet';
import { TokenPocketWalletAdapter } from '@solana/wallet-adapter-tokenpocket';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';
import { ExodusWalletAdapter } from '@solana/wallet-adapter-exodus';
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger';
import { SafePalWalletAdapter } from '@solana/wallet-adapter-safepal';
import { CloverWalletAdapter } from '@solana/wallet-adapter-clover';
import { BitpieWalletAdapter } from '@solana/wallet-adapter-bitpie';
import { Coin98WalletAdapter } from '@solana/wallet-adapter-coin98';
import { HuobiWalletAdapter } from '@solana/wallet-adapter-huobi';
import { SpotWalletAdapter } from '@solana/wallet-adapter-spot';

// Toast notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import "@solana/wallet-adapter-react-ui/styles.css";
import "./App.css";

import './App.css';


// Constants
const DECIMALS = 9;
const TOTAL_SUPPLY = 2000000000;
const AVAILABLE_FOR_PURCHASE = 800000000;
const PRICE_PER_TOKEN = 0.0375;
const TOKEN_AUTHORITY = new PublicKey("ACF5o8USHkcexBrbuTL1KFsDhL44qyC3a9L1euW23hGP");

// Language options
const LANGUAGES = [
  { code: 'en', name: 'English' },
 
];

// Translations
const TRANSLATIONS = {
  en: {
    SolynX:"SolynX",
    home: "Home",
    presale: "Presale",
    roadmap: "Roadmap",
    whitepaper: "Whitepaper",
    ailab: "AI Lab",
    connectWallet: "Connect Wallet",
    selectLanguage: "Select Language",
  },
  
  
};

interface TransactionHistory {
  txId: string;
  amount: number;
  cost: number;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
}

function WalletContent() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet, connect, connected } = useWallet();
  const [status, setStatus] = useState("");
  const [amountToBuy, setAmountToBuy] = useState<number>(1000);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 12,
    minutes: 34,
    seconds: 22
  });
  const [activeTab, setActiveTab] = useState('home');
  const [scrolling, setScrolling] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showWhitepaper, setShowWhitepaper] = useState(false);
  const [showAILab, setShowAILab] = useState(false);
  const [nftDescription, setNftDescription] = useState("");
  const [isGeneratingNFT, setIsGeneratingNFT] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);
  const [teamMembers] = useState([
    
     
  ]);
  const [faqs] = useState([
    {
      question: "What is SolynX.AI?",
      answer: "SolynX.AI is a decentralized artificial intelligence platform built on the Solana blockchain that combines cutting-edge AI models with blockchain technology to provide transparent, secure and efficient AI services."
    },
    {
      question: "How does the presale work?",
      answer: "During the presale, you can purchase SYX tokens at a discounted price. Tokens will be distributed after the presale concludes. There are multiple rounds with increasing prices."
    },
    {
      question: "What can I do with SYX tokens?",
      answer: "SYX tokens are the utility token of the SolynX.AI ecosystem. They can be used to pay for AI services, participate in governance, stake for rewards, and access premium features."
    },
    {
      question: "When will the tokens be listed?",
      answer: "We plan to list SYX on decentralized exchanges immediately after the presale concludes, followed by centralized exchange listings in subsequent phases."
    },
    {
      question: "Is there a vesting period?",
      answer: "Presale tokens have no vesting period and will be distributed immediately after the presale ends. Team and advisor tokens have a 12-month linear vesting schedule."
    },
    {
      question: "How can I participate in governance?",
      answer: "SYX token holders can participate in governance by staking their tokens and voting on proposals that shape the future of the SolynX.AI platform."
    }
  ]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Get current translations
  const t = TRANSLATIONS[currentLanguage as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  // Format numbers with decimals
  const formatNumber = (value: number | undefined, decimals: number = 4): string => {
    if (value === undefined || isNaN(value)) return '0'.padEnd(decimals + 2, '.0');
    return value.toFixed(decimals);
  };

  // Calculate total cost
  const totalCost = useMemo(() => {
    return amountToBuy * PRICE_PER_TOKEN;
  }, [amountToBuy]);

  // Handle scroll to detect tab changes
  useEffect(() => {
    const handleScroll = () => {
      if (scrolling || showWhitepaper || showAILab) return;
      
      const sections = ['home', 'presale', 'roadmap', 'team', 'faq'];
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition > offsetTop && scrollPosition <= offsetTop + offsetHeight) {
            setActiveTab(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolling, showWhitepaper, showAILab]);

  // Scroll to section when tab is clicked
  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'whitepaper') {
      setShowWhitepaper(true);
      setShowAILab(false);
      setActiveTab('whitepaper');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (sectionId === 'ailab') {
      setShowAILab(true);
      setShowWhitepaper(false);
      setActiveTab('ailab');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setShowWhitepaper(false);
    setShowAILab(false);
    setScrolling(true);
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth'
      });
    }
    setTimeout(() => setScrolling(false), 1000);
  };

  // Fetch SOL balance
  useEffect(() => {
    if (!publicKey || !connection) return;

    const fetchBalance = async () => {
      try {
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast.error("Failed to fetch wallet balance");
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, [publicKey, connection]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) return { ...prev, seconds: seconds - 1 };
        if (minutes > 0) return { ...prev, minutes: minutes - 1, seconds: 59 };
        if (hours > 0) return { ...prev, hours: hours - 1, minutes: 59, seconds: 59 };
        if (days > 0) return { ...prev, days: days - 1, hours: 23, minutes: 59, seconds: 59 };
        
        clearInterval(timer);
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate market data fetch
  useEffect(() => {
    if (showAILab) {
      const interval = setInterval(() => {
        setMarketData({
          price: (Math.random() * 100).toFixed(2),
          trend: Math.random() > 0.5 ? 'up' : 'down',
          confidence: (Math.random() * 100).toFixed(0)
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [showAILab]);

  // Buy tokens function
  const buyTokens = async () => {
    if (!publicKey || !connection || !sendTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    if (amountToBuy <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    setStatus("Processing transaction...");

    try {
      const lamports = Math.ceil(totalCost * LAMPORTS_PER_SOL);
      
      const transaction = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TOKEN_AUTHORITY,
          lamports,
        })
      );

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      setLastTransaction(signature);

      const newTransaction: TransactionHistory = {
        txId: signature,
        amount: amountToBuy,
        cost: totalCost,
        timestamp: new Date(),
        status: 'pending'
      };

      setTransactionHistory(prev => [newTransaction, ...prev]);
      toast.success("Transaction sent! Waiting for confirmation...");

      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      setStatus("Transaction confirmed!");
      toast.success("Tokens purchased successfully!");
      
      setTransactionHistory(prev => prev.map(tx => 
        tx.txId === signature ? { ...tx, status: 'success' } : tx
      ));

    } catch (error) {
      console.error("Transaction error:", error);
      setStatus("Transaction failed");
      toast.error("Failed to complete transaction");
      
      if (lastTransaction) {
        setTransactionHistory(prev => prev.map(tx => 
          tx.txId === lastTransaction ? { ...tx, status: 'failed' } : tx
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate NFT function
  const generateNFT = async () => {
    if (!nftDescription) {
      toast.error("Please describe your NFT");
      return;
    }

    setIsGeneratingNFT(true);
    toast.info("Generating your NFT...");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would call your AI API here
      const nftImage = `https://picsum.photos/400/400?random=${Date.now()}`;
      
      toast.success("NFT generated successfully!");
      document.getElementById('ai-nft-output')!.innerHTML = `
        <img src="${nftImage}" alt="Generated NFT" style="width:100%; border-radius:8px;" />
        <p style="margin-top:10px; color:#fff;">${nftDescription}</p>
      `;
    } catch (error) {
      toast.error("Failed to generate NFT");
    } finally {
      setIsGeneratingNFT(false);
    }
  };

  // Toggle FAQ item
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Whitepaper content
  const WhitepaperContent = () => (
    <div className="whitepaper-content glass-card">
      <button className="back-button" onClick={() => scrollToSection('home')}>
        ← Back
      </button>
      
      <h1 className="whitepaper-title">Whitepaper SolynX.AI</h1>
      
      <div className="whitepaper-section">
        <h2>1. Introduction</h2>
        <p>
          SolynX.AI is a revolutionary platform that combines artificial intelligence with blockchain technology to create decentralized and transparent solutions. Our goal is to democratize access to advanced AI tools, ensuring security, privacy and efficiency through the Solana blockchain.
        </p>
      </div>
      
      <div className="whitepaper-section">
        <h2>2. Project Overview</h2>
        <p>
          The SolynX.AI ecosystem consists of:
        </p>
        <ul>
          <li>Decentralized AI platform</li>
          <li>SYX token as ecosystem utility</li>
          <li>AI models trained and optimized for blockchain</li>
          <li>Community governance</li>
        </ul>
      </div>
      
      <div className="whitepaper-section">
        <h2>3. Technology</h2>
        <h3>3.1 Architecture</h3>
        <p>
          Our architecture combines smart contracts on Solana with specialized AI models. Each AI request is processed in a decentralized manner, with verifiable results on the blockchain.
        </p>
        
        <h3>3.2 SYX Token</h3>
        <p>
          The SYX token has the following functions:
        </p>
        <ul>
          <li>Payment for AI services</li>
          <li>Ecosystem governance</li>
          <li>Rewards for resource providers</li>
          <li>Access to premium features</li>
        </ul>
      </div>
      
      <div className="whitepaper-section">
        <h2>4. Tokenomics</h2>
        <table className="whitepaper-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Supply</td>
              <td>2,000,000,000 SYX</td>
            </tr>
            <tr>
              <td>Presale</td>
              <td>800,000,000 SYX (40%)</td>
            </tr>
            <tr>
              <td>Team & Development</td>
              <td>300,000,000 SYX (15%)</td>
            </tr>
            <tr>
              <td>Partners & Marketing</td>
              <td>200,000,000 SYX (10%)</td>
            </tr>
            <tr>
              <td>Liquidity</td>
              <td>400,000,000 SYX (20%)</td>
            </tr>
            <tr>
              <td>Community & Rewards</td>
              <td>300,000,000 SYX (15%)</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="whitepaper-section">
        <h2>5. Roadmap</h2>
        <p>
          See the Roadmap section for complete details about our development and launch plan.
        </p>
      </div>
      
      <div className="whitepaper-section">
        <h2>6. Team</h2>
        <p>
          Our team consists of experts in blockchain, artificial intelligence and business development with extensive experience in innovative projects.
        </p>
      </div>
      
      <div className="whitepaper-section">
        <h2>7. Conclusion</h2>
        <p>
          SolynX.AI represents the next generation of artificial intelligence platforms, combining the benefits of decentralization with cutting-edge AI technology. We invite you to join us on this revolutionary journey.
        </p>
      </div>
      
      <div className="whitepaper-cta">
        <button 
          className="buy-button"
          onClick={() => {
            scrollToSection('presale');
            setShowWhitepaper(false);
          }}
        >
          JOIN THE PRESALE
        </button>
      </div>
    </div>
  );
 
 // AI Lab content
 const AILabContent = () => (
  <div className="ai-lab-content black-theme">
    <button className="back-button" onClick={() => scrollToSection('home')}>
      ← Back
    </button>
    
    <h1 className="ai-lab-title">SolynX AI Lab</h1>
    <p className="ai-lab-subtitle">Experience the power of AI in the crypto world</p>
    
    <div className="ai-demo-container">
     

   
    </div>
    
    {/* Use Cases Section */}
    <div className="use-cases">
      <h2>🚀 updates coming soon!</h2>
      
      <div className="case-card">
        <h4>Smart Contract Auditor</h4>
        <p>AI that detects vulnerabilities in smart contracts with 94% accuracy</p>
        <button className="case-button">Try Demo</button>
      </div>
      
      <div className="case-card">
        <h4>DeFi Yield Optimizer</h4>
        <p>Automatic allocation between protocols to maximize APY</p>
        <button className="case-button">Try Demo</button>
      </div>
      
      <div className="case-card">
        <h4>Crypto Sentiment Analysis</h4>
        <p>Real-time analysis of market sentiment across social media</p>
        <button className="case-button">Try Demo</button>
      </div>
    </div>
    
    <div className="ai-lab-cta">
      <h3>Ready to experience AI-powered crypto?</h3>
      <button 
        className="buy-button"
        onClick={() => {
          scrollToSection('presale');
          setShowAILab(false);
        }}
      >
        BUY SYX TOKENS TO ACCESS
      </button>
    </div>
  </div>
);

 

  // FAQ content
  const FAQContent = () => (
    <div className="faq-content glass-card">
      <h2 className="section-title">Frequently Asked Questions</h2>
      <p className="section-subtitle">Find answers to common questions about SolynX.AI</p>
      
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`faq-item ${activeFaq === index ? 'active' : ''}`}
            onClick={() => toggleFaq(index)}
          >
            <div className="faq-question">
              <h3>{faq.question}</h3>
              <span className="toggle-icon">
                {activeFaq === index ? '−' : '+'}
              </span>
            </div>
            {activeFaq === index && (
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="contact-cta">
        <h3>Still have questions?</h3>
        <p>Join our community or contact our support team</p>
        <div className="contact-buttons">
          <button className="telegram-button">Telegram</button>
          <button className="email-button">Email Us</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Header with Tabs and Wallet Button */}
      <header className="app-header">
        <div className="header-content">
          <div className="navigation-tabs">  
            
         <p className="titlethe" > SolynX.AI</p>
           
          </div>
          <div className="header-right">
         
            <div className="wallet-button-container">
              <WalletMultiButton className="wallet-button">{t.connectWallet}</WalletMultiButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Now using sections for scrolling */}
      <main className="main-content">
        {showWhitepaper ? (
          <WhitepaperContent />
        ) : showAILab ? (
          <AILabContent />
        ) : (
          <>
        
       {/* Presale Section */}
<section id="presale" className="section">
  <div className="presale-content modern-card">
    <div className="presale-header">
      <h2 className="presale-title">Exclusive Opportunity ASY Token Presale</h2>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: '65%' }}></div>
      
      </div>
    </div>

    <div className="presale-grid">
      {/* Countdown Timer */}
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

     {/*CODIGO DAS INFO DO SUPLY E ETC AQUI */}

{/* Stats 
<div className="stats-modern">
        <div className="stat-row">
          <div className="stat-item-modern">
            <span className="stat-label">TOTAL SUPPLY</span>
            <span className="stat-value">2,000,000,000 SYX</span>
          </div>
          <div className="stat-item-modern">
            <span className="stat-label">PRESALE AVAILABLE</span>
            <span className="stat-value">800,000,000 SYX</span>
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-item-modern">
            <span className="stat-label">TOKEN PRICE</span>
            <span className="stat-value">0.0375 SOL (next price 0.075)</span>
          </div>
          <div className="stat-item-modern">
            <span className="stat-label">SOLD</span>
            <span className="stat-value">520,000,000 SYX</span>
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-item-modern">
            <span className="stat-label">RAISED</span>
            <span className="stat-value">19,500,000 SOL</span>
          </div>
          <div className="stat-item-modern">
            <span className="stat-label">CURRENT PHASE</span>
            <span className="stat-value highlight">ROUND 2 OF 7</span>
          </div>
        </div>
      </div>
      */}

      {/* Purchase Section */}
      <div className="purchase-modern">
        <div className="amount-selector">
          <label>SELECT AMOUNT (SYX)</label>
          <div className="amount-input">
            <input
              type="number"
              value={amountToBuy}
              onChange={(e) => setAmountToBuy(Number(e.target.value))}
              min={1000}
              step={1000}
            />
            <div className="quick-buttons">
              <button onClick={() => setAmountToBuy(1000)}>1K</button>
              <button onClick={() => setAmountToBuy(5000)}>5K</button>
              <button onClick={() => setAmountToBuy(10000)}>10K</button>
              <button onClick={() => setAmountToBuy(50000)}>50K</button>
            </div>
          </div>
        </div>

        <div className="summary-modern">
          <div className="summary-row">
            <span>YOU WILL RECEIVE</span>
            <span>{amountToBuy.toLocaleString()} SYX</span>
          </div>
          <div className="summary-row">
            <span>TOTAL COST</span>
            <span>{formatNumber(totalCost)} SOL</span>
          </div>
          <div className="summary-row">
            <span>YOUR SOL BALANCE</span>
            <span>{formatNumber(solBalance)} SOL</span>
          </div>
          <div className="summary-row highlight">
            <span>CURRENT BONUS</span>
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
            totalCost > solBalance ? "INSUFFICIENT SOL BALANCE" : "PURCHASE SYX TOKENS"
          ) : (
            "CONNECT WALLET TO PURCHASE"
          )}
        </button>

        <div className="disclaimer">
          <p>Tokens will be distributed after the presale concludes. Bonus tokens will be automatically credited.</p>
        </div>
      </div>
    </div>
  </div>

  {/* Transaction History */}
  {lastTransaction && (
    <div className="transaction-details glass-card">
      <h3>Last Transaction</h3>
      <p>ID {lastTransaction}</p>
      <p>Status Processing</p>
    </div>
  )}

  {transactionHistory.length > 0 && (
    <div className="transaction-history glass-card">
      <h3>Transaction History</h3>
      <div className="history-table">
        <div className="history-header">
          <span>Date</span>
          <span>Amount</span>
          <span>Cost</span>
          <span>Status</span>
        </div>
        {transactionHistory.map((tx, index) => (
          <div className="history-row" key={index}>
            <span>{tx.timestamp.toLocaleString()}</span>
            <span>{tx.amount} SYX</span>
            <span>{tx.cost} SOL</span>
            <span className={`status-${tx.status}`}>{tx.status}</span>
          </div>
        ))}
      </div>
    </div>
  )}
</section>



            {/* Roadmap Section */}
            <section id="roadmap" className="section">
              <div className="roadmap-content glass-card">
                <h2 className="roadmap-title">SolynX.AI Journey</h2>
                <p className="roadmap-subtitle">Our strategic plan to build the most advanced blockchain AI platform</p>
                
                <div className="roadmap-timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h3>Q1 2025: Foundation</h3>
                      <ul>
                        <li>Project conception and market research</li>
                        <li>Formation of core development team</li>
                        <li>Development of technical whitepaper</li>
                        <li>First smart contract prototypes</li>
                        <li>Initial strategic partnerships</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h3>Q2 2025: Development</h3>
                      <ul>
                        <li>Finalization of tokenomics and governance model</li>
                        <li>Complete smart contract audits</li>
                        <li>Web platform and API development</li>
                        <li>Private funding round</li>
                        <li>Initial integration of AI models</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h3>Q3 2025: Presale & Launch</h3>
                      <ul>
                        <li>Public presale event for SYX tokens</li>
                        <li>Listings on decentralized exchanges</li>
                        <li>Initial token distribution</li>
                        <li>Integration of basic AI models</li>
                        <li>Launch of first SDK version</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h3>Q4 2025: Expansion</h3>
                      <ul>
                        <li>Listings on centralized exchanges</li>
                        <li>Announcement of strategic project partnerships</li>
                        <li>Implementation of advanced AI features</li>
                        <li>Community growth initiatives</li>
                        <li>Developer incentive program</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h3>2025: Ecosystem Growth</h3>
                      <ul>
                        <li>Full platform launch</li>
                        <li>Mobile app with complete features</li>
                        <li>Custom enterprise solutions</li>
                        <li>Global expansion and localization</li>
                        <li>Integration with multiple blockchains</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h3>2025: Future Vision</h3>
                      <ul>
                        <li>Implementation of general AI</li>
                        <li>Fully decentralized governance</li>
                        <li>Self-sustaining ecosystem</li>
                        <li>Mass adoption across various sectors</li>
                        <li>Revolutionizing the AI industry</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="roadmap-cta">
                  <h3>Join Us On This Journey</h3>
                  <p>Participate in the presale and become one of the pioneers in the decentralized artificial intelligence revolution. Support the project by acquiring SYX tokens and gain exclusive benefits in the SolynX.AI ecosystem.</p>
                  <button 
                    className="buy-button"
                    onClick={() => scrollToSection('presale')}
                  >
                    JOIN THE PRESALE
                  </button>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="section">
              <FAQContent />
            </section>
          </>
        )}
      </main>
       
      <footer className="app-footer">
        <div className="footer-content glass-card">
          <div className="footer-logo">
            <h3>SolynX.AI</h3>
            <p>Blockchain Artificial Intelligence</p>
          </div>
          <div className="footer-links">
            <a href="#" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('whitepaper'); }}>Whitepaper</a>
            <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection('ailab'); }}>AI Lab</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Contact</a>
          </div>
          <div className="footer-social">
            <p>Follow us on social media</p>
            <div className="social-icons">
              <a href="#" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="#" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a href="#" target="_blank" rel="noopener noreferrer">Discord</a>
              <a href="#" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </div>
        <div className="footer-copyright">
          <p>© 2025 SolynX.AI. All rights reserved.</p>
        </div>
      </footer>

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

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
      new BraveWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new MathWalletAdapter(),
      new TokenPocketWalletAdapter(),
      new TrustWalletAdapter(),
      new ExodusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SafePalWalletAdapter(),
      new CloverWalletAdapter(),
      new BitpieWalletAdapter(),
      new Coin98WalletAdapter(),
      new HuobiWalletAdapter(),
      new SpotWalletAdapter(),   
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletMultiButton />
          {/* Your app's components go here, nested within the context providers. */}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;

