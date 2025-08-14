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

// 4. Exclude react-native-maps and unused fonts from web bundle
if (process.env.EXPO_PLATFORM === 'web') {
  config.resolver.blockList = [
    /node_modules\/react-native-maps\/.*$/,
    // This regex blocks all .ttf files in the vector-icons fonts directory
    // except for Ionicons.ttf, which is the only one used in the app.
    /node_modules\/@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\/(?!Ionicons\.ttf$).*\.ttf$/,
  ];
}

// Add these optimizations
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;
