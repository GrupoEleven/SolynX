import AsyncStorage from "@react-native-async-storage/async-storage";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from 'bs58';  // Changed this line
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,  // Added this import
} from "react";

const ASYNC_STORAGE_KEY = "@my_fake_wallet_keypair_key";

interface EncodedKeypair {
  publicKeyBase58: string;
  secretKeyBase58: string;
}

function encodeKeypair(keypair: Keypair): EncodedKeypair {
  return {
    publicKeyBase58: keypair.publicKey.toBase58(),
    secretKeyBase58: bs58.encode(keypair.secretKey),  // Changed to bs58.encode
  };
}

function decodeKeypair(encodedKeypair: EncodedKeypair): Keypair {
  const secretKey = bs58.decode(encodedKeypair.secretKeyBase58);  // Changed to bs58.decode
  return Keypair.fromSecretKey(secretKey);
}

export interface WalletContextData {
  wallet: Keypair | null;
  connection: Connection;
}

const WalletContext = createContext<WalletContextData>({
  wallet: null,
  connection: new Connection("https://api.devnet.solana.com"),
});

export const useWallet = () => useContext(WalletContext);

export interface WalletProviderProps {
  rpcUrl?: string;
  children: ReactNode;
}

export function WalletProvider(props: WalletProviderProps) {
  const { rpcUrl, children } = props;
  const [keyPair, setKeyPair] = useState<Keypair | null>(null);
  
  const fetchOrGenerateKeypair = async () => {
    try {
      const storedKey = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      let keyPair;
      if (storedKey) {
        const encodedKeypair: EncodedKeypair = JSON.parse(storedKey);
        keyPair = decodeKeypair(encodedKeypair);
      } else {
        keyPair = Keypair.generate();
        await AsyncStorage.setItem(
          ASYNC_STORAGE_KEY,
          JSON.stringify(encodeKeypair(keyPair)),
        );
      }
      setKeyPair(keyPair);
    } catch (error) {
      console.log("error getting keypair: ", error);
    }
  };

  useEffect(() => {
    fetchOrGenerateKeypair();
  }, []);

  const connection = useMemo(
    () => new Connection(rpcUrl ?? "https://api.devnet.solana.com"),
    [rpcUrl],
  );

  const value = {
    wallet: keyPair,
    connection,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
