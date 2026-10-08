const path = require('node:path');
module.exports = function (api) {
  const development = api.env() !== 'production';
  return {
    presets: ['babel-preset-expo'],
    plugins: development ? [[require.resolve('@react-native-blueprint/react-native/babel'), {
      root: path.resolve(__dirname, '../..'),
      include: ['examples/expo-router/showcase/'],
    }]] : [],
  };
};
