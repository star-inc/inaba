import {
    parse as parseUrl,
} from "node:url";

import {
    useConfig,
} from "../../config/index.mjs";

import {
    bottleServer,
    sessionPoolNode,
} from "../../bottle/server.mjs";

import {
    authNode, socketToHttpResponse,
} from "../../utils/http.mjs";
import {
    isWebSocketUpgradeRequest,
    useSendMessage,
} from "../../utils/websocket.mjs";
import { relayWebsocket } from "../../bottle/index.mjs";
import { WebSocketServer } from "ws";

const {
    proxy: proxyConfig,
} = useConfig();

const {
    entrypoint_path: entrypointPath,
} = proxyConfig;

function bottleRunner({ req, socket, head }) {
    const { url: requestedUrl } = req;
    const { pathname } = parseUrl(requestedUrl);

    const actualPath = pathname;
    const expectPath = `${entrypointPath}bottle`;
    if (actualPath !== expectPath) {
        socket.destroy();
    }

    try {
        const {nodeKey} = authNode(req);
        bottleServer.handleUpgrade(req, socket, head, (ws) => {
            if (sessionPoolNode.has(nodeKey)) {
                const sendMessage = useSendMessage(ws);
                sendMessage({
                    type: 'exception',
                    text: 'session already exists'
                });
                ws.close();
                return;
            }
    
            ws.nodeKey = nodeKey;
            bottleServer.emit('connection', ws, req);
        });
    } catch (e) {
        console.warn(`[Proxy Server] Bottle thrown \"${e.message}\".`);
        socket.destroy();
    }
}

const relayServer = new WebSocketServer({noServer: true});
function relayRunner({ req, socket, head, host }) {
    const { node_map: nodeMap } = useConfig();

    const node = Object.
        entries(nodeMap).
        find(([_, v]) => v.includes(host));
    if (!node) {
        const res = socketToHttpResponse(socket);
        res.writeHead(512, { 'content-type': 'text/plain' });
        res.write(`Inaba Proxy: Host \"${host}\" is unmanaged by Inaba Network.`);
        res.end();
        return;
    }

    const [nodeKey] = node;
    if (!sessionPoolNode.has(nodeKey)) {
        const res = socketToHttpResponse(socket);
        res.writeHead(502, { 'content-type': 'text/plain' });
        res.write(`Inaba Proxy: Remote node \"${host}\" has been disconnected from Inaba Network.`);
        res.end();
        return;
    }

    try {
        const nodeSession = sessionPoolNode.get(nodeKey);
        relayServer.handleUpgrade(req, socket, head, (ws) => {
            relayWebsocket(nodeSession, req, ws);
        });
    } catch (e) {
        console.warn(`[Proxy Server] Relay thrown \"${e.message}\".`);
        socket.destroy();
    }
}

export default function onUpgrade(req, socket, head) {
    const { headers } = req;
    const { host } = headers;

    if (!isWebSocketUpgradeRequest) {
        const res = socketToHttpResponse(socket);
        res.writeHead(400, { 'content-type': 'text/plain' })
        res.write("Inaba Proxy: Not WebSocket upgrade.");
        res.end();
    }

    const {
        proxy: proxyConfig,
    } = useConfig();
    const {
        entrypoint_host: entrypointHost,
    } = proxyConfig;

    if (host === entrypointHost) {
        bottleRunner({req, socket, head})
    } else {
        relayRunner({ req, socket, head, host });
    }
}
