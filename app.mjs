import { createServer } from 'node:http';
import { parse } from 'node:url';
import { WebSocketServer } from 'ws';

import {
  loadConfig,
  useConfig,
} from './src/config.mjs';

import {
  register,
} from './src/bottle.mjs';

import {
  onPong,
  onMessage,
  onError,
} from './src/handlers.mjs';

loadConfig();

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

const config = useConfig();
const connectionPool = new Map();

wss.on('connection', function connection(ws) {
  ws.isAlive = true;
  ws.on('pong', onPong);
  ws.on('message', onMessage);
  ws.on('error', onError);
})

server.on('request', (req, res) => {
  const { headers } = req;

  const keypair = Object.entries(config.servers).
    find((i) => i[1].domains.includes(headers.host));

  if (keypair && connectionPool.has(keypair[0])) {
    const ws = connectionPool.get(keypair[0]);
    register(ws, req, res);
  } else {
    res.write(headers.host);
    res.end();
  }
});

server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);

  if (pathname !== '/entrypoint') {
    socket.destroy();
    return;
  }

  const key = request.headers["x-inaba-key"];
  if (key) {

  } else {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request);
    connectionPool.set(key, ws);
  });
});

server.listen(8080);
