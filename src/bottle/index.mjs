import uniqid from 'uniqid';

import {
    useConfig,
} from "../config/index.mjs";

import {
    sessionPoolTube,
} from './server.mjs';

import {
    useSendMessage
} from '../utils/websocket.mjs';

export function relayHttp(nodeSession, req, res) {
    const { headers, url: urlPath, method, socket } = req;
    const { remoteAddress, encrypted } = socket;
    const { host: urlHost } = headers;
    const urlSheme = encrypted ? "https:": "http:";
    
    const {
        proxy: proxyConfig,
    } = useConfig();
    const {
        timeout_request: timeoutRequest
    } = proxyConfig;

    const urlRaw = new URL(`${urlSheme}//${urlHost}${urlPath}`);
    const url = urlRaw.toString();

    headers["x-forwarded-for"] = remoteAddress;

    const requestId = uniqid();
    const sessionPool = sessionPoolTube.get(nodeSession.nodeKey);
    sessionPool.set(requestId, {type: "http", req, res});

    const sendMessage = useSendMessage(nodeSession);
    sendMessage({
        type: "httpRequestHead",
        requestId, url, method, headers
    });
    req.on('data', (chunk) => {
        sendMessage({
            type: "httpRequestBody",
            requestId,
            chunk: chunk.toString('base64'),
        });
    });
    req.on('end', () => {
        sendMessage({
            type: "httpRequestFoot",
            requestId
        });
    });
    setTimeout(() => {
        sendMessage({
            type: "httpRequestAbort",
            requestId
        });
        res.end();
    }, timeoutRequest);
}

export function relayWebsocket(nodeSession, req, ws) {
    const { headers, url: urlPath, socket } = req;
    const { remoteAddress, encrypted } = socket;
    const { host: urlHost } = headers;
    const urlSheme = encrypted ? "https:": "http:";

    const urlRaw = new URL(`${urlSheme}//${urlHost}${urlPath}`);
    const url = urlRaw.toString();

    headers["x-forwarded-for"] = remoteAddress;

    const requestId = uniqid();
    const sessionPool = sessionPoolTube.get(nodeSession.nodeKey);
    sessionPool.set(requestId, {type: "websocket", req, ws});
    
    const sendMessage = useSendMessage(nodeSession);
    sendMessage({
        type: "websocketOpen",
        requestId, url, headers
    });
    ws.on('pong', (chunk) => {
        sendMessage({
            type: "websocketPong",
            requestId, chunk
        });
    });
    ws.on('message', (chunk, isBinary) => {
        sendMessage({
            type: "websocketSend",
            requestId,
            chunk: chunk.toString('base64'),
            isBinary,
        });
    });
    ws.on('close', () => {
        sendMessage({
            type: "websocketClose",
            requestId
        });
    });
}

export function killAllTubes(nodeKey) {
    const requests = sessionPoolTube.get(nodeKey);
    for (const [requestId, request] of requests.entries()) {
        const {type} = request;
        switch (type) {
            case "http": {
                const {res} = request;
                res.end();
                break;
            }
            case "websocket": {
                const {ws} = request;
                ws.terminate();
                break;
            }
            default: {
                console.warn(`[Bottle] Unsupported request type \"${type}\".`);
            }
        }
        request.delete(requestId);
    }
}
