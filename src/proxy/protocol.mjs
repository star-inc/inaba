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
    readFileSync,
    existsSync,
} from 'node:fs';

import {
    useConfig
} from "../config/index.mjs";

import {
    acmePath
} from "../utils/data.mjs";

export function getCredentials(serverName) {
    const certPath = new URL(`${serverName}.crt`, acmePath);
    const keyPath = new URL(`${serverName}.key`, acmePath);

    if (!existsSync(certPath) || !existsSync(keyPath)) {
        throw new Error(`credential for ${serverName} not exist`);
    }

    return {
        cert: readFileSync(certPath),
        key: readFileSync(keyPath)
    };
}

function SNICallback(serverName, callback) {
    try {
        const credentials = getCredentials(serverName);
        const context = createSecureContext(credentials);
        callback(null, context);
    } catch (e) {
        callback(e, null);
    }
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
    const serverOptions = { ...credentials, SNICallback }
    return createHttpsServer(serverOptions);
}
