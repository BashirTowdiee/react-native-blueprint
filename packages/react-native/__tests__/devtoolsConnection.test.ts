const { connectBlueprintDevTools } = require('../devtools.cjs');
class FakeSocket {
  readyState = 1;
  listeners = new Map<string, Set<(message: any) => void>>();
  send = jest.fn();
  close = jest.fn(() => this.emit('close'));
  addEventListener(type: string, fn: any) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type)!.add(fn); }
  removeEventListener(type: string, fn: any) { this.listeners.get(type)?.delete(fn); }
  emit(type: string, data?: any) { this.listeners.get(type)?.forEach((fn) => fn(data)); }
}
it('uses the official messaging API, forwards events and disposes/retries the transport', () => {
  jest.useFakeTimers();
  const sockets: FakeSocket[] = [];
  let options: any;
  const cleanup = jest.fn();
  const backend = { connectWithCustomMessagingProtocol: jest.fn((opts) => { options = opts; return cleanup; }) };
  const open = jest.fn();
  const connection = connectBlueprintDevTools(backend, { createWebSocket: () => { const socket = new FakeSocket(); sockets.push(socket); return socket; }, open });
  const changed = jest.fn(); connection.subscribe(changed);
  expect(connection.getSnapshot()).toBe('waiting');
  sockets[0].emit('open');
  expect(connection.getSnapshot()).toBe('connected');
  const receive = jest.fn(); options.onSubscribe(receive);
  sockets[0].emit('message', { data: JSON.stringify({ event: 'inspectElement', payload: { id: 4 } }) });
  expect(receive).toHaveBeenCalledWith({ event: 'inspectElement', payload: { id: 4 } });
  options.onMessage('operations', [1, 2]);
  expect(sockets[0].send).toHaveBeenCalledWith(JSON.stringify({ event: 'operations', payload: [1, 2] }));
  options.onUnsubscribe(receive);
  sockets[0].emit('close');
  expect(cleanup).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(2000);
  expect(sockets).toHaveLength(2);
  connection.open(); expect(open).toHaveBeenCalled();
  connection.dispose(); jest.advanceTimersByTime(5000);
  expect(sockets).toHaveLength(2);
  jest.useRealTimers();
});

it('waits for frontend readiness and never sends an old bridge into a new socket', () => {
  jest.useFakeTimers();
  const sockets: FakeSocket[] = [];
  const bridges: any[] = [];
  const backend = { connectWithCustomMessagingProtocol: jest.fn((opts) => { bridges.push(opts); return jest.fn(); }) };
  const connection = connectBlueprintDevTools(backend, { readyMessage: 'ready', createWebSocket: () => { const socket = new FakeSocket(); sockets.push(socket); return socket; }, open: jest.fn() });
  sockets[0].emit('open'); expect(backend.connectWithCustomMessagingProtocol).not.toHaveBeenCalled();
  sockets[0].emit('message', { data: 'ready' }); sockets[0].emit('message', { data: 'ready' });
  expect(backend.connectWithCustomMessagingProtocol).toHaveBeenCalledTimes(1);
  sockets[0].readyState = 3; sockets[0].emit('close'); jest.advanceTimersByTime(2000);
  sockets[1].emit('message', { data: 'ready' });
  bridges[0].onMessage('operations', [1]);
  expect(sockets[1].send).not.toHaveBeenCalled();
  connection.dispose(); jest.useRealTimers();
});
