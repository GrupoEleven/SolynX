import "./polyfills";
import { Buffer } from "buffer";
import { AppRegistry } from "react-native";
import React from "react";
import App from "./App";
import MWAApp from "./MWAApp";
import { name as appName } from "./app.json";

// Polyfills
window.Buffer = Buffer;
window.addEventListener = () => {};
window.removeEventListener = () => {};

// Mobile specific imports
import {
  MWARequest,
  MWASessionEvent,
  MobileWalletAdapterConfig,
  useMobileWalletAdapterSession,
} from "@solana-mobile/mobile-wallet-adapter-protocol";

// Web specific imports 
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles
import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";

function Main() {
  // Check if we're running on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    // Register mobile components
    AppRegistry.registerComponent(appName, () => App);
    AppRegistry.registerComponent("MobileWalletAdapterEntrypoint", () => MWAApp);
    
    return (
      <React.StrictMode>
        <MWAApp />
      </React.StrictMode>
    );
  }

  // Web version setup
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  const wallets = [];

  return (
    <React.StrictMode>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <App />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </React.StrictMode>
  );
}

// For web
if (!isMobile) {
  ReactDOM.createRoot(document.getElementById("root")!).render(<Main />);
}

// For mobile
export default Main;
