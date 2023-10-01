import {
    passthrough,
    finish,
} from './bottle.mjs';

export function onPong() {
    this.isAlive = true;
}

export function onMessage(buffer) {
    const text = buffer.toString();
    const data = JSON.parse(text);

    const { type, requestId } = data;

    switch (type) {
        case "passthrough": {
            passthrough(requestId, data);
            break;
        }
        case "finish": {
            finish(requestId);
            break;
        }
    }
}

export function onError() {
}
