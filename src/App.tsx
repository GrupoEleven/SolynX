import { useEffect, useState } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const NETWORK = "devnet";
const RPC_URL = clusterApiUrl(NETWORK);
const RECEIVER_WALLET = new PublicKey("ACF5o8USHkcexBrbuTL1KFsDhL44qyC3a9L1euW23hGP");

const App = () => {
  const [walletAddress, setWalletAddress] = useState<PublicKey | null>(null);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [phantomInstalled, setPhantomInstalled] = useState(false);

  // Verifica se o Phantom está instalado
  useEffect(() => {
    if ("solana" in window) {
      setPhantomInstalled(true);
      const provider = window.solana;
      
      // Verifica se já está conectado
      provider.connect({ onlyIfTrusted: true })
        .then(({ publicKey }) => {
          setWalletAddress(publicKey);
        })
        .catch(() => {
          // Se onlyIfTrusted falhar, significa que não está conectado automaticamente
          setWalletAddress(null);
        });
      
      // Listener para mudanças na conexão
      provider.on("connect", (publicKey: PublicKey) => {
        setWalletAddress(publicKey);
      });
      
      provider.on("disconnect", () => {
        setWalletAddress(null);
      });
      
      return () => {
        provider.removeListener("connect");
        provider.removeListener("disconnect");
      };
    } else {
      setPhantomInstalled(false);
    }
  }, []);

  const connectWallet = async () => {
    if (!phantomInstalled) {
      alert("Instale a carteira Phantom.");
      return;
    }
    
    try {
      const { publicKey } = await window.solana.connect();
      setWalletAddress(publicKey);
    } catch (err) {
      console.error("Erro ao conectar carteira:", err);
      alert("Erro ao conectar carteira. Por favor, tente novamente.");
    }
  };

  const getBalance = async () => {
    if (!walletAddress) return;
    const connection = new Connection(RPC_URL);
    const balance = await connection.getBalance(walletAddress);
    setSolBalance(balance / LAMPORTS_PER_SOL);
  };

  const sendSol = async (amountSol: number) => {
    if (!walletAddress) {
      alert("Conecte a carteira primeiro.");
      return;
    }

    try {
      setLoading(true);
      const connection = new Connection(RPC_URL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletAddress,
          toPubkey: RECEIVER_WALLET,
          lamports: amountSol * LAMPORTS_PER_SOL,
        })
      );

      transaction.feePayer = walletAddress;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await window.solana.signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(txid);

      console.log("Transação confirmada! TXID:", txid);
      getBalance();
    } catch (error) {
      console.error("Erro ao enviar SOL:", error);
      alert("Erro ao enviar SOL. Verifique o console para mais detalhes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      getBalance();
    }
  }, [walletAddress]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial", textAlign: "center" }}>
      <h1>DeAgroX - Conexão Solana</h1>
      {walletAddress ? (
        <>
          <p><strong>Carteira:</strong> {walletAddress.toBase58()}</p>
          <p><strong>Saldo:</strong> {solBalance.toFixed(4)} SOL</p>
          <button onClick={() => sendSol(0.01)} disabled={loading}>
            {loading ? "Enviando..." : "Enviar 0.01 SOL"}
          </button>
        </>
      ) : (
        <button onClick={connectWallet} disabled={!phantomInstalled}>
          {phantomInstalled ? "Conectar carteira Phantom" : "Instale o Phantom Wallet"}
        </button>
      )}
    </div>
  );
};

export default App;