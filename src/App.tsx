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
const RECEIVER_WALLET = new PublicKey("ACF5o8USHkcexBrbuTL1KFsDhL44qyC3a9L1euW23hGP"); // ⬅️ Troque aqui

const App = () => {
  const [walletAddress, setWalletAddress] = useState<PublicKey | null>(null);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if ("solana" in window) {
      const provider = window.solana;
      if (provider.isPhantom) {
        try {
          const resp = await provider.connect();
          setWalletAddress(resp.publicKey);
        } catch (err) {
          console.error("Erro ao conectar carteira:", err);
        }
      }
    } else {
      alert("Instale a carteira Phantom.");
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.solana?.isPhantom) {
      window.solana.connect({ onlyIfTrusted: true }).then(({ publicKey }) => {
        setWalletAddress(publicKey);
      });
    }
  }, []);

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
        <button onClick={connectWallet}>Conectar carteira Phantom</button>
      )}
    </div>
  );
};

export default App;
