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
    dataPathPrefix
} from "../utils/acme.mjs";

function getCredentials(serverName) {
    const certPath = new URL(`${serverName}.crt`, dataPathPrefix);
    const keyPath = new URL(`${serverName}.key`, dataPathPrefix);
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
    const {
        proxy: proxyConfig,
    } = useConfig();
    const {
        entrypoint_host: entrypointHost
    } = proxyConfig;

    const credentials = getCredentials(entrypointHost);
    const options = {
        ...credentials,
        SNICallback,
    }

    return createHttpsServer(options);
}
