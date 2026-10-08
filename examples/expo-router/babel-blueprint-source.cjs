// Compatibility entry for the example's source metadata tests.
const plugin = require('@react-native-blueprint/react-native/babel');
const path = require('node:path');
module.exports = (api) => {
  const implementation = plugin(api);
  const visit = implementation.visitor.JSXOpeningElement;
  implementation.visitor.JSXOpeningElement = (element, state) => {
    state.opts = { ...state.opts, root: path.resolve(__dirname, '../..'), include: ['examples/expo-router/showcase/'] };
    visit(element, state);
  };
  return implementation;
};
