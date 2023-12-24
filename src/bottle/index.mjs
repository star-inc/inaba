import uniqid from 'uniqid';

import {
    sessionRequests,
} from './server.mjs';

import {
    useSendMessage
} from '../utils/websocket.mjs';

const bottlePool = new Map();

export function register(ws, req, res) {
    const { headers, url: urlPath, method } = req;
    const { host: urlHost } = headers;
    const sendMessage = useSendMessage(ws);

    const urlRaw = new URL(`http://${urlHost}${urlPath}`);
    const url = urlRaw.toString();

    const requestId = uniqid();
    bottlePool.set(requestId, {
        req, res
    });

    const requestIdsOld = sessionRequests.get(ws.sessionId);
    const requestIdsNew = [...requestIdsOld, requestId];
    sessionRequests.set(ws.sessionId, requestIdsNew);

    sendMessage({
        type: "register",
        requestId, url, method, headers
    })
}

export function head(requestId, data) {
    const { statusCode, headers } = data;
    const { res } = bottlePool.get(requestId);

    if ('content-encoding' in headers) {
        delete headers['content-encoding'];
    }

    res.writeHead(statusCode, {
        ...headers,
        "x-powered-by": "inaba"
    });
}

export function passthrough(requestId, data) {
    const { chunk } = data;
    const buffer = Buffer.from(chunk, "base64");
    const { res } = bottlePool.get(requestId);
    res.write(buffer);
}

export function exception(requestId, data) {
    const { text } = data;
    const { res } = bottlePool.get(requestId);
    res.write(`Mond Exception: ${text}`)
    res.end();
    bottlePool.delete(requestId);
}

export function interrupt(sessionId) {
    const requestIds = sessionRequests.get(sessionId);
    for (const requestId of requestIds) {
        finish(requestId);
    }
}

export function finish(requestId) {
    const { res } = bottlePool.get(requestId);
    if (res.end) {
        res.end();
    }
    bottlePool.delete(requestId);

    const requestIdsOld = sessionRequests.get(ws.sessionId);
    const requestIdsNew = requestIdsOld.filter((i) => i === requestId);
    sessionRequests.set(ws.sessionId, requestIdsNew);
}
