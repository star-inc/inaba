import {
    head,
    passthrough,
    exception,
    finish,
} from './index.mjs';

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
}
