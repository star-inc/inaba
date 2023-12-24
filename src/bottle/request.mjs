import uniqid from 'uniqid';

import {
    sessionRequests
} from './server.mjs';

import {
    useSendMessage
} from '../utils/websocket.mjs';

export const requestPool = new Map();

export function invokeHttp(ws, req, res) {
    const { headers, url: urlPath, method } = req;
    const { host: urlHost } = headers;
    const sendMessage = useSendMessage(ws);

    const urlRaw = new URL(`http://${urlHost}${urlPath}`);
    const url = urlRaw.toString();

    const requestId = uniqid();
    requestPool.set(requestId, {
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

export function revokeAllBySession(sessionId) {
    const requestIds = sessionRequests.get(sessionId);
    for (const requestId of requestIds) {
        finish(requestId);
    }
}
