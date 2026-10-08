// A window-owned singleton also survives duplicate development entry bundles.
if (!window.__BLUEPRINT_DEVTOOLS_CONNECTION__) {
  const { connectBlueprintDevTools } = require('@react-native-blueprint/react-native/devtools');
  const backend = require('react-devtools-core');
  const host = window.location.hostname;
  let session;
  try {
    session = window.sessionStorage.getItem('blueprint-devtools-session') || window.crypto.randomUUID();
    window.sessionStorage.setItem('blueprint-devtools-session', session);
  } catch { session = window.crypto.randomUUID(); }
  window.__BLUEPRINT_DEVTOOLS_CONNECTION__ = connectBlueprintDevTools(backend, {
    createWebSocket: () => new WebSocket(`ws://${host}:8097/app?session=${session}`),
    readyMessage: 'blueprint-companion-ready',
    open: () => window.open(`http://${host}:8098/?session=${session}`, '_blank', 'noopener,noreferrer'),
  });
}
module.exports = window.__BLUEPRINT_DEVTOOLS_CONNECTION__;
