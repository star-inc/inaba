import {
    parse as parseUrl
} from "node:url";

import {
    useConfig
} from "../config/index.mjs";

import {
    wsPool,
    wsServer
} from '../websocket/server.mjs';

import {
    register,
} from '../websocket/bottle.mjs';

export function onRequest(req, res) {
    const { headers } = req;
    const { servers } = useConfig();

    const keypair = Object.entries(servers).
        find((i) => i[1].hosts.includes(headers.host));

    if (keypair && wsPool.has(keypair[0])) {
        const ws = wsPool.get(keypair[0]);
        register(ws, req, res);
    } else {
        res.write(headers.host);
        res.end();
    }
}

export function onUpgrade(request, socket, head) {
    const { url: requestedUrl } = request;
    const { pathname } = parseUrl(requestedUrl);

    if (pathname !== '/entrypoint') {
        socket.destroy();
        return;
    }

    const key = request.headers["x-inaba-key"];
    if (!key) {
        socket.destroy();
        return;
    }

    wsServer.handleUpgrade(request, socket, head, function done(ws) {
        wsServer.emit('connection', ws, request);
        wsPool.set(key, ws);
    });
}
