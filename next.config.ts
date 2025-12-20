import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude smart contract directories from Next.js build
  // See .nextignore for detailed exclusions
  webpack: (config) => {
    // Ignore script files from murky library that use Node.js-specific modules
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\/lib\/creator-token-contracts\/lib\/murky\/.*\/scripts\/.*$/,
      })
    );

    // Handle React Native modules in web environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };

    // Provide empty mocks for React Native modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    return config;
  },
  // Note: Using --webpack flag in build script to avoid Turbopack compatibility issues
};

export default nextConfig;
