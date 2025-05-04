import { useCallback, useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WalletProvider } from "./components/WalletProvider";
import {
  MWARequest,
  MWASessionEvent,
  MobileWalletAdapterConfig,
  useMobileWalletAdapterSession,
} from "@solana-mobile/mobile-wallet-adapter-walletlib";
const styles = StyleSheet.create({
  container: {
    margin: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: "black",
  },
});

function MWAApp() {
  const config: MobileWalletAdapterConfig = useMemo(() => {
    return {
      supportsSignAndSendTransactions: true,
      maxTransactionsPerSigningRequest: 10,
      maxMessagesPerSigningRequest: 10,
      supportedTransactionVersions: [0, "legacy"],
      noConnectionWarningTimeoutMs: 3000,
      optionalFeatures: {}
    };
  }, []);

  const handleRequest = useCallback((request: MWARequest) => {
    if (request.__type === MWARequestType.ReauthorizeDappRequest) {
      resolve(request, {
        authorizationScope: new TextEncoder().encode("app"),
      });
    }
  }, []);
  
  
  
  
  const handleSessionEvent = useCallback((sessionEvent: MWASessionEvent) => {
    if (sessionEvent.__type === MWASessionEventType.SessionTerminatedEvent) {
      setTimeout(() => {
        BackHandler.exitApp();
      }, 200);
    }
  }, []);

  useMobileWalletAdapterSession(
    "React Native Fake Wallet",
    config, 
    handleRequest,
    handleSessionEvent,
  );

  return (
    <SafeAreaView>
      <WalletProvider>
        <View style={styles.container}>
          <Text style={{ fontSize: 50 }}>I'm a wallet!</Text>
        </View>
      </WalletProvider>
    </SafeAreaView>
  );
}

export default MWAApp;
