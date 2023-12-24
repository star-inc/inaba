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
    useSendMessage,
} from "../utils/websocket.mjs";

import {
    sessionPool,
    wsServer
} from '../bottle/server.mjs';
import {
    invokeHttp as invokeHttpRequest,
} from '../bottle/request.mjs';

export function onRequest(req, res) {
    const { headers } = req;
    const { host } = headers;

    const {
        proxy: proxyConfig,
        node_map: nodeMap,
    } = useConfig();
    const {
        entrypoint_host: entrypointHost,
    } = proxyConfig;

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

    const nodeKey = nodeMap[host];
    if (!nodeKey) {
        res.writeHead(512, {
            'content-type': 'text/plain'
        })
        res.write(`Inaba Proxy: Host \"${host}\" is unmanaged by Inaba Network.`);
        res.end();
        return;
    }

    if (!sessionPool.has(nodeKey)) {
        res.writeHead(502, {
            'content-type': 'text/plain'
        })
        res.write(`Inaba Proxy: Remote node \"${headers.host}\" has been disconnected from Inaba Network.`);
        res.end();
        return;
    }

    const ws = sessionPool.get(nodeKey);
    invokeHttpRequest(ws, req, res);
}

export function onUpgrade(req, socket, head) {
    const { headers, url: requestedUrl } = req;
    const { host } = headers;
    const { pathname } = parseUrl(requestedUrl);

    const {
        proxy: proxyConfig,
        node_map: nodeMap,
    } = useConfig();
    const {
        entrypoint_host: entrypointHost,
        entrypoint_path: entrypointPath
    } = proxyConfig;

    if (host === entrypointHost && pathname === entrypointPath) {
        const keyRaw = req.headers["x-inaba-key"];
        if (!keyRaw) {
            socket.destroy();
            return;
        }

        const key = md5hex(keyRaw);
        const isNodeExists = Object.
            values(nodeMap).
            findIndex((v) => v === key) !== -1;

        if (!isNodeExists) {
            socket.destroy();
            return;
        }

        wsServer.handleUpgrade(req, socket, head, function done(ws) {
            if (sessionPool.has(key)) {
                const sendMessage = useSendMessage(ws);
                sendMessage({
                    type: 'exception',
                    text: 'session already exists'
                });
                ws.close();
                return;
            }

            ws.sessionId = key;
            wsServer.emit('connection', ws, req);
        });
        return
    }

    socket.destroy();
}
