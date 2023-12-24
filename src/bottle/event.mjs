import {
    revokeAllBySession
} from './index.mjs';

import {
    methods as messageMethods,
} from './message.mjs';

import {
    sessionPool,
    sessionRequests,
} from './server.mjs';

import {
    isObjectPropExists
} from '../utils/native.mjs';

export function onPong() {
    this.isAlive = true;
}

export function onMessage(buffer) {
    const text = buffer.toString();
    const data = JSON.parse(text);

    const { type } = data;
    if (isObjectPropExists(messageMethods, type)) {
        const method = messageMethods[type];
        method.call(this, data);
    } else {
        console.warn(`[Bottle] Unsupported message type \"${type}\".`)
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
