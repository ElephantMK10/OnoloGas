const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Enable caching
config.cacheStores = [
  new FileStore({
    root: './.metro-cache',
  }),
];

// Only minify in production
if (process.env.NODE_ENV === 'production') {
  config.transformer = {
    ...config.transformer,
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      keep_fnames: false, // Allow full minification in production
    },
  };
}

// Use 50% of available CPUs for parallel processing
config.maxWorkers = Math.max(1, Math.floor(require('os').cpus().length / 2));

// Handle SVGs as source files (components)
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Web exclusions
if (process.env.EXPO_PLATFORM === 'web') {
  config.resolver.blockList = [
    /node_modules\/react-native-maps\/.*$/,
    /node_modules\/@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\/(?!Ionicons\.ttf$).*\.ttf$/
  ];
}

// Only set these in local development
if (!process.env.EAS_BUILD) {
  const workspaceRoot = path.resolve(projectRoot, '../..');
  config.watchFolders = [workspaceRoot];
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ];
  config.resolver.disableHierarchicalLookup = true;
}

module.exports = config;
