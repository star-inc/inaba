import uniqid from 'uniqid';

import {
    useSendMessage
} from '../utils.mjs';

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
    sendMessage({
        type: "register",
        requestId, url, method, headers
    })
}

export function passthrough(requestId, data) {
    const { chunk } = data;
    const buffer = Buffer.from(chunk, "base64");
    const { res } = bottlePool.get(requestId);
    res.write(buffer);
}

export function finish(requestId) {
    const { res } = bottlePool.get(requestId);
    res.end();
    bottlePool.delete(requestId);
}
