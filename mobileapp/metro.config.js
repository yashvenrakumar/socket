// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure resolver to handle TypeScript and ensure proper path resolution
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'ts', 'tsx'],
  // Ensure Metro can resolve relative paths correctly
  unstable_enablePackageExports: false,
};

module.exports = config;
