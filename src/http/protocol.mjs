import {
    createServer as createHttpServer
} from 'node:http';
import {
    createServer as createHttpsServer
} from 'node:https';

import {
    createSecureContext
} from 'node:tls';

import {
    readFileSync
} from 'node:fs';

import {
    useConfig
} from "../config/index.mjs";

import {
    certsPrefix
} from "./acme.mjs";

function getCredentials(serverName) {
    const certPath = new URL(`${serverName}.crt`, certsPrefix);
    const keyPath = new URL(`${serverName}.key`, certsPrefix);
    return {
        cert: readFileSync(certPath),
        key: readFileSync(keyPath)
    };
}

function SNICallback(serverName, callback) {
    const credentials = getCredentials(serverName);
    const context = createSecureContext(credentials);
    callback(null, context);
}

export const useHttp = () => {
    return createHttpServer();
}

export const useHttps = () => {
    const { entrypoint } = useConfig();
    const [hostname] = entrypoint.host.split(":", 1);

    const credentials = getCredentials(hostname);
    const options = {
        ...credentials,
        SNICallback,
    }

    return createHttpsServer(options);
}
