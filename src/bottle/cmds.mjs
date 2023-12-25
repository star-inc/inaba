import {
    sessionRequests,
} from "./server.mjs";

export const requestPool = new Map();

export const methods = {
    httpResponseHead,
    httpResponseBody,
    httpResponseFoot,
    exception,
}

export function httpResponseHead(data) {
    const { requestId, statusCode, headers } = data;
    const { res } = requestPool.get(requestId);

    if ('content-encoding' in headers) {
        delete headers['content-encoding'];
    }
    if ('content-length' in headers) {
        delete headers['content-length'];
    }

    headers["x-powered-by"] = "inaba"

    res.writeHead(statusCode, headers);
}

export function httpResponseBody(data) {
    const { requestId, chunk } = data;
    const buffer = Buffer.from(chunk, "base64");
    const { res } = requestPool.get(requestId);
    res.write(buffer);
}

export function httpResponseFoot(data) {
    const { requestId } = data;

    if (requestPool.has(requestId)) {
        const { res } = requestPool.get(requestId);
        res.end();
        requestPool.delete(requestId);
    }

    const requestIdsOld = sessionRequests.get(this.sessionId);
    const requestIdsNew = requestIdsOld.filter((i) => i !== requestId);
    sessionRequests.set(this.sessionId, requestIdsNew);
}

export function exception(data) {
    const { requestId, text } = data;
    const { res } = requestPool.get(requestId);
    res.write(`Mond Exception: ${text}`)
    res.end();
    requestPool.delete(requestId);
}
