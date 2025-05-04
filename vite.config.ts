import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure Vite for both web and mobile development
export default defineConfig({
  plugins: [react()],
  server: {
    https: process.env.NODE_ENV === 'development' ? {
      key: fs.readFileSync('./cert/key.pem'),
      cert: fs.readFileSync('./cert/cert.pem'),
    } : undefined,
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    alias: {
      // Add React Native Web alias
      'react-native': 'react-native-web',
      // Add Mobile Wallet Adapter aliases
      '@solana-mobile/mobile-wallet-adapter-protocol': '@solana-mobile/mobile-wallet-adapter-protocol-web3js',
      '@solana-mobile/mobile-wallet-adapter-walletlib': '@solana-mobile/mobile-wallet-adapter-protocol'
    },
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      '@solana-mobile/mobile-wallet-adapter-protocol-web3js',
      '@solana-mobile/mobile-wallet-adapter-protocol',
      'buffer',
      'react-native-web'
    ],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        bigint: true
      },
    }
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  }
});
