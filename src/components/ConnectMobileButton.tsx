import { useWallet } from "../contexts/WalletContext";

export const ConnectMobileButton = () => {
  const { connectWallet, publicKey } = useWallet();

  return (
    <button
      onClick={connectWallet}
      style={{
        padding: "10px 20px",
        background: "#9945FF",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      {publicKey 
        ? `Conectado: ${publicKey.toBase58().slice(0, 6)}...` 
        : "Conectar Carteira Mobile"}
    </button>
  );
};
