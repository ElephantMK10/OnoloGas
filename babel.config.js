module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@screens': './app',
            '@utils': './utils',
            '@assets': './assets',
            '@hooks': './hooks',
            '@constants': './constants',
            '@types': './types',
            '@navigation': './navigation',
            '@services': './services',
            '@theme': './theme',
          },
        },
      ],
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};