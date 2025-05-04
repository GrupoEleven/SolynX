import { useCallback, useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WalletProvider } from "./components/WalletProvider";
import {
  MWARequest,
  MWASessionEvent,
  MobileWalletAdapterConfig, 
  useMobileWalletAdapterSession,
} from "@solana-mobile/mobile-wallet-adapter-protocol";

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
    };
  }, []);

  const handleRequest = useCallback((request: MWARequest) => {}, []);
  const handleSessionEvent = useCallback(
    (sessionEvent: MWASessionEvent) => {},
    [],
  );

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
