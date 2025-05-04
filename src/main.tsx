import "./polyfills";
import { Buffer } from "buffer";
import { AppRegistry } from "react-native";
import React from "react";
import App from "./App";
import MWAApp from "./MWAApp";
import { name as appName } from "./app.json";

// Polyfills required for mobile wallet adapter
window.Buffer = Buffer;
window.addEventListener = () => {};
window.removeEventListener = () => {};

// Import wallet adapter components
import {
  MWARequest,
  MWASessionEvent,
  MobileWalletAdapterConfig,
  useMobileWalletAdapterSession
} from "@solana-mobile/mobile-wallet-adapter-walletlib";

// Import React-DOM
import { createRoot } from 'react-dom/client';

function Main() {
  // Register the required components for Mobile Wallet Adapter
  AppRegistry.registerComponent(appName, () => App);
  AppRegistry.registerComponent("MobileWalletAdapterEntrypoint", () => MWAApp);
  
  return (
    <React.StrictMode>
      <MWAApp />
    </React.StrictMode>
  );
}

// Mount the app
const root = createRoot(document.getElementById('root')!);
root.render(<Main />);

export default Main;