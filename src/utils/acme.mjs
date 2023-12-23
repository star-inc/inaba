import {
    existsSync
} from "node:fs";

import {
    useConfig
} from "../config/index.mjs";

export const renewKeypair = new Map();
export const renewPathPrefix = "/.well-known/acme-challenge/";

export const certsPrefix = new URL("../../ssl_keys/", import.meta.url);

export function checkHostCertificate() {
    const {
        proxy_server: proxyServerConfig
    } = useConfig();

    const {
        node_map: nodeMap,
    } = proxyServerConfig;

    return nodeMap.flatMap((server) => server.hosts
        .map((host) => new URL(host).hostname)
        .filter((serverName) => !isCertificateReady(serverName))
    );
}

export async function isCertificateReady(serverName) {
    const csrPath = new URL(`${serverName}.csr`, certsPrefix);
    if (!existsSync(csrPath)) {
        return false;
    }

    const certPath = new URL(`${serverName}.crt`, certsPrefix);
    if (!existsSync(certPath)) {
        return false;
    }

    const keyPath = new URL(`${serverName}.key`, certsPrefix);
    if (!existsSync(keyPath)) {
        return false;
    }

    return true;
}
