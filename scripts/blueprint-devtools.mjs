// Optional local companion, using the official DevTools frontend bundled by Expo.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const WebSocket = require('ws');
const expoCli = dirname(require.resolve('@expo/cli/package.json'));
const frontend = join(expoCli, 'static/react-devtools-page/standalone.js');
const relay = new WebSocket.Server({ host: '127.0.0.1', port: 8097 });
const sessions = new Map();
relay.on('connection', (socket, request) => {
  const url = new URL(request.url, 'http://localhost');
  const id = url.searchParams.get('session');
  if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) { socket.close(); return; }
  if (!sessions.has(id)) sessions.set(id, { ready: false, pending: [], sessionStarted: false });
  const state = sessions.get(id);
  const initializeApp = () => {
    if (!state.ready || state.app?.readyState !== WebSocket.OPEN) return;
    state.sessionStarted = true;
    state.app.send('blueprint-companion-ready');
    for (const message of state.pending) state.app.send(message);
    state.pending = [];
  };
  if (url.pathname === '/app') {
    state.app?.close(); state.app = socket;
    if (state.ready && state.sessionStarted) state.frontend.send('blueprint-app-disconnected');
    else initializeApp();
    socket.on('message', (message) => { if (state.ready && state.frontend?.readyState === WebSocket.OPEN) state.frontend.send(message.toString()); });
    socket.on('close', () => { if (state.app === socket) {
      state.app = undefined;
      if (state.frontend?.readyState === WebSocket.OPEN) state.frontend.send('blueprint-app-disconnected');
      else sessions.delete(id);
    } });
  } else if (url.pathname === '/frontend') {
    state.frontend?.close(); state.frontend = socket; state.ready = false; state.sessionStarted = false; state.pending = [];
    socket.on('message', (message) => {
      const text = message.toString();
      if (text === 'blueprint-frontend-ready') { state.ready = true; initializeApp(); }
      else if (state.ready && state.app?.readyState === WebSocket.OPEN) state.app.send(text);
      else if (state.pending.length < 100) state.pending.push(text);
    });
    socket.on('close', () => { if (state.frontend === socket) { state.ready = false; state.frontend = undefined; state.app?.close(); } });
  } else socket.close();
});
const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname === '/standalone.js') {
    response.setHeader('Content-Type', 'text/javascript');
    response.end(await readFile(frontend));
  } else if (url.pathname === '/') {
    response.setHeader('Content-Type', 'text/html');
    const session = url.searchParams.get('session');
    if (!session || !/^[a-zA-Z0-9-]+$/.test(session)) {
      response.end(`<html><head><meta charset="utf-8"><title>Blueprint React DevTools</title></head><body style="font:16px system-ui;padding:24px"><h2>React DevTools sessions</h2><p>Use Open React tree in Blueprint Settings to inspect that app window.</p>${[...sessions.keys()].map((id) => `<p><a href="/?session=${id}">App ${id.slice(0, 8)}</a></p>`).join('')}</body></html>`);
      return;
    }
    response.end(`<!doctype html><html><head><meta charset="utf-8"><title>Blueprint · React DevTools</title><style>html,body,#root{height:100%;margin:0}body{font:14px system-ui;background:#111;color:#ddd}#status{padding:12px}</style></head><body><div id="status">Connecting to the app…</div><div id="root"></div><script type="module">
      import DevTools from '/standalone.js';
      const status = document.getElementById('status');
      const socket = new WebSocket('ws://' + location.hostname + ':8097/frontend?session=${session}');
      socket.addEventListener('message', (event) => { if (event.data === 'blueprint-app-disconnected') { event.stopImmediatePropagation(); location.reload(); } });
      socket.addEventListener('open', () => { status.hidden = true; DevTools.setContentDOMNode(document.getElementById('root')); DevTools.connectToSocket(socket); socket.send('blueprint-frontend-ready'); });
      socket.addEventListener('close', () => { status.hidden = false; status.textContent = 'Disconnected. Reload this view, then reload the app to reconnect.'; });
    </script></body></html>`);
  } else { response.statusCode = 404; response.end(); }
});
server.listen(8098, '127.0.0.1', () => console.log('Blueprint React DevTools: http://localhost:8098 · relay localhost:8097'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { for (const client of relay.clients) client.close(); relay.close(); server.close(); });
