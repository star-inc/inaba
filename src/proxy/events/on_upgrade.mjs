import {
    parse as parseUrl,
} from "node:url";

import {
    useConfig,
} from "../../config/index.mjs";

import {
    authNode,
} from "../../utils/http.mjs";
import {
    useSendMessage,
} from "../../utils/websocket.mjs";

const {
    proxy: proxyConfig,
} = useConfig();

const {
    entrypoint_path: entrypointPath,
} = proxyConfig;

function bottleExchanger({ req, socket, head }) {
    const { url: requestedUrl } = req;
    const { pathname } = parseUrl(requestedUrl);

    const actualPath = pathname;
    const expectPath = `${entrypointPath}/exchanger`;
    if (actualPath !== expectPath) {
        socket.destroy();
    }

    try {
        const {nodeKey} = authNode(req);
        bottleServer.handleUpgrade(req, socket, head, (ws) => {
            if (sessionPool.has(nodeKey)) {
                const sendMessage = useSendMessage(ws);
                sendMessage({
                    type: 'exception',
                    text: 'session already exists'
                });
                ws.close();
                return;
            }
    
            ws.sessionId = nodeKey;
            bottleServer.emit('connection', ws, req);
        });
    } catch (_) {
        socket.destroy();
    }
}

export default function onUpgrade(req, socket, head) {
    const { headers } = req;
    const { host } = headers;

    const {
        proxy: proxyConfig,
    } = useConfig();
    const {
        entrypoint_host: entrypointHost,
    } = proxyConfig;

    if (host === entrypointHost) {
        bottleExchanger({req, socket, head})
    } else {
        socket.destroy();
    }
}
