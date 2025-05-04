import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native-web";
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {
  AuthorizationResult,
  AuthToken
} from '@solana-mobile/mobile-wallet-adapter-protocol';

function MWAApp() {
  const [authToken, setAuthToken] = useState<AuthToken | null>(null);

  const APP_IDENTITY = {
    name: "Your App Name",
    uri: "https://your-app-website.com"
  };

  const handleConnect = async () => {
    try {
      await transact(async (wallet: Web3MobileWallet) => {
        const authResult = await wallet.authorize({
          cluster: "devnet",
          identity: APP_IDENTITY,
        });
        setAuthToken(authResult.auth_token);
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View>
      <Text>Mobile Wallet Connection Test</Text>
      <button onClick={handleConnect}>Connect Wallet</button>
    </View>
  );
}

export default MWAApp;