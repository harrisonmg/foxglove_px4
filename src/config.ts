module.exports = {
  webpack: (config: any) => {
    config.devtool = undefined; // disable source maps to reduce bundle size
    return config;
  },
};
