// Pre-React entry: an injected official backend keeps this adapter renderer independent.
exports.connectBlueprintDevTools = function (backend, options = {}) {
  let status = 'waiting';
  let socket, cleanup, retry;
  let disposed = false;
  const listeners = new Set();
  const setStatus = (next) => { if (status !== next) { status = next; listeners.forEach((listener) => listener()); } };
  const connect = () => {
    if (disposed) return;
    try {
      socket = options.createWebSocket();
      const transport = socket;
      const initialize = () => {
        if (disposed || socket !== transport) return;
        const subscriptions = new Map();
        cleanup = backend.connectWithCustomMessagingProtocol({
          onSubscribe(listener) {
            const receive = (message) => {
              try { listener(JSON.parse(message.data)); } catch { /* Ignore malformed transport messages. */ }
            };
            subscriptions.set(listener, receive);
            transport.addEventListener('message', receive);
          },
          onUnsubscribe(listener) {
            const receive = subscriptions.get(listener);
            if (receive) transport.removeEventListener('message', receive);
            subscriptions.delete(listener);
          },
          onMessage(event, payload) {
            if (transport.readyState === 1) transport.send(JSON.stringify({ event, payload }));
          },
        });
        setStatus(typeof cleanup === 'function' ? 'connected' : 'unavailable');
      };
      if (options.readyMessage) transport.addEventListener('message', (message) => {
        if (message.data === options.readyMessage && !cleanup) initialize();
      });
      else transport.addEventListener('open', initialize);
      transport.addEventListener('error', () => { if (!disposed && socket === transport) setStatus('disconnected'); });
      transport.addEventListener('close', () => {
        if (socket !== transport) return;
        cleanup?.(); cleanup = undefined;
        setStatus('disconnected');
        if (!disposed) retry = setTimeout(connect, 2000);
      });
    } catch { setStatus('unavailable'); }
  };
  connect();
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot: () => status,
    open: options.open,
    dispose() { disposed = true; clearTimeout(retry); cleanup?.(); cleanup = undefined; socket?.close(); listeners.clear(); },
  };
};
