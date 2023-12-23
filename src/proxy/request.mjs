import {
    parse as parseUrl
} from "node:url";

import {
    useConfig
} from "../config/index.mjs";

import {
    md5hex
} from "../utils/native.mjs";

import {
    wsPool,
    wsServer
} from '../bottle/server.mjs';

import {
    register,
} from '../bottle/index.mjs';

export function onRequest(req, res) {
    const { headers } = req;
    const { host } = headers;

    const {
        proxy_server: proxyServerConfig,
        nodes
    } = useConfig();
    const {
        entrypoint_host: entrypointHost,
    } = proxyServerConfig;

    if (host === entrypointHost) {
        res.writeHead(418, {
            'content-type': 'text/html'
        })
        res.write(`
            Inaba Network <br />
            <a href="https://github.com/star-inc/inaba" target="_blank">
                https://github.com/star-inc/inaba
            </a>
        `);
        res.end();
        return;
    }

    const nodeKey = nodes[host];
    if (!nodeKey) {
        res.writeHead(512, {
            'content-type': 'text/html'
        })
        res.write(`
            Inaba Proxy: Host \"${host}\"
            is unmanaged by Inaba Network.
        `);
        res.end();
        return;
    }

    if (!wsPool.has(nodeKey)) {
        res.writeHead(502, {
            'content-type': 'text/html'
        })
        res.write(`
            Inaba Proxy: Remote node \"${headers.host}\"
            has been disconnected from Inaba Network.
        `);
        res.end();
        return;
    }

    const ws = wsPool.get(nodeKey);
    register(ws, req, res);
}

export function onUpgrade(req, socket, head) {
    const { headers, url: requestedUrl } = req;
    const { host } = headers;
    const { pathname } = parseUrl(requestedUrl);

    const {
        proxy_server: proxyServerConfig,
        nodes,
    } = useConfig();
    const {
        entrypoint_host: entrypointHost,
        entrypoint_path: entrypointPath
    } = proxyServerConfig;

    if (host === entrypointHost && pathname === entrypointPath) {
        const keyRaw = req.headers["x-inaba-key"];
        if (!keyRaw) {
            socket.destroy();
            return;
        }

        const key = md5hex(keyRaw);
        const isNodeExists = Object.
            values(nodes).
            findIndex((v) => v === key) !== -1;

        if (!isNodeExists) {
            socket.destroy();
            return;
        }

        wsServer.handleUpgrade(req, socket, head, function done(ws) {
            wsServer.emit('connection', ws, req);
            wsPool.set(key, ws);
        });
        return
    }

    socket.destroy();
}
