// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

// Only use workspace in local development
const workspaceRoot = process.env.EAS_BUILD
  ? projectRoot
  : path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Exclude SVGs from the asset bundle
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');

// Only set these in local development
if (!process.env.EAS_BUILD) {
  // 1. Watch all files within the monorepo
  config.watchFolders = [workspaceRoot];
  // 2. Let Metro know where to resolve packages and in what order
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ];
  // 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
  config.resolver.disableHierarchicalLookup = true;
}

// 4. Exclude react-native-maps from web bundle
if (process.env.EXPO_PLATFORM === 'web') {
  config.resolver.blockList = [/node_modules\/react-native-maps\/.*$/];
}

module.exports = config;
