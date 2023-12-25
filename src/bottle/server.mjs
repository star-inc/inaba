import { WebSocketServer } from 'ws';

import {
    onPong,
    onMessage,
    onError,
    onClose,
} from './events.mjs';

export const sessionPool = new Map();
export const sessionRequests = new Map();

export const bottleServer = new WebSocketServer({ noServer: true });

bottleServer.on('connection', function connection(ws) {
    sessionPool.set(ws.sessionId, ws);
    sessionRequests.set(ws.sessionId, []);
    console.info(`[Bottle] Session \"${ws.sessionId}\" connected.`)

    ws.isAlive = true;
    ws.on('pong', onPong);
    ws.on('message', onMessage);
    ws.on('error', onError);
    ws.on('close', onClose);
})
