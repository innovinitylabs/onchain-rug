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

    return config;
  },
};

export default nextConfig;
