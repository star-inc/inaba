import { WebSocketServer } from 'ws';

import {
    onPong,
    onMessage,
    onError,
    onClose,
} from './event.mjs';

export const wsPool = new Map();

export const wsServer = new WebSocketServer({ noServer: true });

wsServer.on('connection', function connection(ws) {
    ws.isAlive = true;
    ws.on('pong', onPong);
    ws.on('message', onMessage);
    ws.on('error', onError);
    ws.on('close', onClose);
})
