/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    config.externals.push(
      "pino-pretty",
      "lokijs",
      "encoding",
      "@coinbase/cdp-sdk",
      "@x402/evm",
      "@x402/core",
      "@x402/svm",
      "@base-org/account",
      "@react-native-async-storage/async-storage"
    );
    return config;
  },
};

export default nextConfig;
