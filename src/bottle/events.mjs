import {
    revokeAllBySession
} from './index.mjs';

import {
    methods as messageMethods,
} from './cmds.mjs';

import {
    sessionPoolNode,
    sessionPoolTube,
} from './server.mjs';

import {
    isObjectPropExists
} from '../utils/native.mjs';

export function onPong() {
    this.isAlive = true;
}

function isSessionHasRequest(nodeKey, requestId) {
    const requestIds = sessionPoolTube.get(nodeKey);
    return requestIds.has(requestId);
}

export function onMessage(buffer) {
    const text = buffer.toString();
    const data = JSON.parse(text);

    const { requestId, type } = data;
    if (!isSessionHasRequest(this.nodeKey, requestId)) {
        return;
    } else if (isObjectPropExists(messageMethods, type)) {
        const method = messageMethods[type];
        method.call(this, data);
    } else {
        console.warn(`[Bottle] Unsupported message type \"${type}\".`)
    }
}

export function onError(e) {
    console.error(`[Bottle] Session \"${this.nodeKey}\" thrown \"${e.message}\".`);
}

export function onClose() {
    revokeAllBySession(this.nodeKey);
    sessionPoolNode.delete(this.nodeKey);
    sessionPoolTube.delete(this.nodeKey);
    console.info(`[Bottle] Session \"${this.nodeKey}\" closed gracefully.`)
}
