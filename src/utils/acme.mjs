import {
    existsSync
} from "node:fs";

export const renewKeypair = new Map();
export const renewPathPrefix = "/.well-known/acme-challenge/";

export const certsPrefix = new URL("../../ssl_keys/", import.meta.url);

export function isCertificateReady(serverName) {
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
