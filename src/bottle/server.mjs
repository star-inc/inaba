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
export const bottleHeartbeat = setInterval(() => {
    bottleServer.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

bottleServer.on('connection', function connection(ws) {
    sessionPool.set(ws.sessionId, ws);
    sessionRequests.set(ws.sessionId, []);
    console.info(`[Bottle] Session \"${ws.sessionId}\" connected.`)

    ws.isAlive = true;
    ws.on('pong', onPong);
    ws.on('message', onMessage);
    ws.on('error', onError);
    ws.on('close', onClose);
});

bottleServer.on('close', () => {
    clearInterval(bottleHeartbeat);
});
