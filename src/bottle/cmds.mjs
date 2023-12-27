import {
    sessionPoolTube,
} from "./server.mjs";

export const methods = {
    httpResponseHead,
    httpResponseBody,
    httpResponseFoot,
    httpResponseException,
    websocketPing,
    websocketSend,
    websocketClose,
    websocketException,
}

export function httpResponseHead(data) {
    const { requestId, statusCode, headers } = data;
    if ('content-encoding' in headers) {
        delete headers['content-encoding'];
    }
    if ('content-length' in headers) {
        delete headers['content-length'];
    }

    headers["x-powered-by"] = "inaba"

    const sessionPool = sessionPoolTube.get(this.nodeKey);
    const { res } = sessionPool.get(requestId);
    res.writeHead(statusCode, headers);
}

export function httpResponseBody(data) {
    const { requestId, chunk } = data;
    const buffer = Buffer.from(chunk, "base64");
    const sessionPool = sessionPoolTube.get(this.nodeKey);
    const { res } = sessionPool.get(requestId);
    res.write(buffer);
}

export function httpResponseFoot(data) {
    const { requestId } = data;
    const sessionPool = sessionPoolTube.get(this.nodeKey);
    const { res } = sessionPool.get(requestId);

    res.end();
    sessionPool.delete(requestId);
}

export function httpResponseException(data) {
    const { requestId, text } = data;
    const sessionPool = sessionPoolTube.get(this.nodeKey);
    const { res } = sessionPool.get(requestId);
    res.write(`Mond Exception: ${text}`)
}

export function websocketPing(data) {
    const { requestId, chunk } = data;
    const sessionPool = sessionPoolTube.get(this.nodeKey);
    const { ws } = sessionPool.get(requestId);
    ws.ping(chunk);
}

export function websocketSend(data) {
    const { requestId, chunk, isBinary } = data;
    const sessionPool = sessionPoolTube.get(this.nodeKey);
    const { ws } = sessionPool.get(requestId);
    const buffer = Buffer.from(chunk, "base64");
    ws.send(buffer, {binary: isBinary});
}

export function websocketClose(data) {
    const { requestId } = data;
    const sessionPool = sessionPoolTube.get(this.nodeKey);
    const { ws } = sessionPool.get(requestId);

    ws.close();
    sessionPool.delete(requestId);
}

export function websocketException(data) {
    const { requestId, text } = data;
    const sessionPool = sessionPoolTube.get(this.nodeKey);
    const { ws } = sessionPool.get(requestId);
    ws.send(`Mond Exception: ${text}`)
}
