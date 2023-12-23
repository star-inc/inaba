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
    acmePath
} from "../utils/data.mjs";

function getCredentials(serverName) {
    const certPath = new URL(`${serverName}.crt`, acmePath);
    const keyPath = new URL(`${serverName}.key`, acmePath);
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
