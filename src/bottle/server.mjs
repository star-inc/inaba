import { WebSocketServer } from 'ws';

import {
    onPong,
    onMessage,
    onError,
    onClose,
} from './events.mjs';

export const sessionPoolNode = new Map();
export const sessionPoolTube = new Map();

export const bottleServer = new WebSocketServer({ noServer: true });
export const bottleHeartbeat = setInterval(() => {
    bottleServer.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, 7000);

bottleServer.on('connection', function connection(ws) {
    sessionPoolNode.set(ws.nodeKey, ws);
    sessionPoolTube.set(ws.nodeKey, new Map());
    console.info(`[Bottle] Session \"${ws.nodeKey}\" connected.`)

    ws.isAlive = true;
    ws.on('pong', onPong);
    ws.on('message', onMessage);
    ws.on('error', onError);
    ws.on('close', onClose);
});

bottleServer.on('close', () => {
    clearInterval(bottleHeartbeat);
});
