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
    useConfig
} from "../config/index.mjs";

const certsPrefix = new URL("../../tls", import.meta.url);

function getCredentials(domain) {
    return {
        cert: new URL(`${domain}.crt`, certsPrefix),
        key: new URL(`${domain}.key`, certsPrefix),
    };
}

function SNICallback(domain) {
    const credentials = getCredentials(domain);
    return createSecureContext(credentials).context;
}

export const useHttp = () => {
    return createHttpServer();
}

export const useHttps = () => {
    const { domain } = useConfig();
    const credentials = getCredentials(domain);
    const options = {
        ...credentials,
        SNICallback,
    }

    return createHttpsServer(options);
}
