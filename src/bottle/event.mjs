import {
    revokeAllBySession
} from './request.mjs';

import {
    head,
    passthrough,
    exception,
    finish,
} from './response.mjs';

import {
    sessionPool,
    sessionRequests,
} from './server.mjs';

export function onPong() {
    this.isAlive = true;
}

export function onMessage(buffer) {
    const text = buffer.toString();
    const data = JSON.parse(text);

    const { type, requestId } = data;

    switch (type) {
        case "head": {
            head(requestId, data);
            break;
        }
        case "passthrough": {
            passthrough(requestId, data);
            break;
        }
        case "exception": {
            exception(requestId, data);
            break;
        }
        case "finish": {
            finish(requestId);
            break;
        }
    }
}

export function onError() {
    try {
        revokeAllBySession(this.sessionId);
        sessionPool.delete(this.sessionId);
        sessionRequests.delete(this.sessionId);
    } catch (e) {
        console.warn(`[Bottle] Session \"${this.sessionId}\" error handling not working due to \"${e.message}\".`);
    } finally {
        console.warn(`[Bottle] Session \"${this.sessionId}\" closed unexpectedly.`);
    }
}

export function onClose() {
    revokeAllBySession(this.sessionId);
    sessionPool.delete(this.sessionId);
    sessionRequests.delete(this.sessionId);
    console.info(`[Bottle] Session \"${this.sessionId}\" closed gracefully.`)
}
