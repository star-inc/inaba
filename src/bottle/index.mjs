import uniqid from 'uniqid';

import {
    sessionRequests
} from './server.mjs';

import {
    requestPool,
    httpResponseFoot,
} from './message.mjs';

import {
    useSendMessage
} from '../utils/websocket.mjs';

export function invokeHttp(req, res) {
    const { headers, url: urlPath, method, socket } = req;
    const { host: urlHost } = headers;
    const { remoteAddress } = socket;
    const sendMessage = useSendMessage(this);

    const urlRaw = new URL(`http://${urlHost}${urlPath}`);
    const url = urlRaw.toString();

    headers["x-forwarded-for"] = remoteAddress;

    const requestId = uniqid();
    requestPool.set(requestId, {req, res});

    const requestIdsOld = sessionRequests.get(this.sessionId);
    const requestIdsNew = [...requestIdsOld, requestId];
    sessionRequests.set(this.sessionId, requestIdsNew);

    sendMessage({
        type: "httpRequestHead",
        requestId, url, method, headers
    })
}

export function revokeAllBySession(sessionId) {
    const requestIds = sessionRequests.get(sessionId);
    for (const requestId of requestIds) {
        httpResponseFoot.call({sessionId}, {requestId});
    }
}
