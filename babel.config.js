module.exports = {
  presets: [
    'babel-preset-expo',
    '@babel/preset-flow',
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
}; 