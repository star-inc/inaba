import {
    requestPool
} from "./request.mjs";

import {
    sessionRequests,
} from "./server.mjs";

export function head(requestId, data) {
    const { statusCode, headers } = data;
    const { res } = requestPool.get(requestId);

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
    const { res } = requestPool.get(requestId);
    res.write(buffer);
}

export function exception(requestId, data) {
    const { text } = data;
    const { res } = requestPool.get(requestId);
    res.write(`Mond Exception: ${text}`)
    res.end();
    requestPool.delete(requestId);
}

export function finish(requestId) {
    const { res } = requestPool.get(requestId);
    if (res.end) {
        res.end();
    }
    requestPool.delete(requestId);

    const requestIdsOld = sessionRequests.get(ws.sessionId);
    const requestIdsNew = requestIdsOld.filter((i) => i === requestId);
    sessionRequests.set(ws.sessionId, requestIdsNew);
}
