// Install the official web DevTools backend before React and its renderer load.
if (__DEV__ && typeof window !== 'undefined' && typeof document !== 'undefined') {
  require('./showcase/devtoolsConnection.cjs');
}
require('expo-router/entry');
