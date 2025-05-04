import { useState } from "react";
import { Text, View, TouchableOpacity } from "react-native-web";
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import type { AuthToken, MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol';

function MWAApp() {
  const [authToken, setAuthToken] = useState<AuthToken | null>(null);

  const APP_IDENTITY = {
    name: "Your App Name",
    uri: "https://your-app-website.com"
  };

  const handleConnect = async () => {
    try {
      await transact(async (wallet: MobileWallet) => {
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
      <TouchableOpacity onPress={handleConnect}>
        <Text>Connect Wallet</Text>
      </TouchableOpacity>
    </View>
  );
}

export default MWAApp;
