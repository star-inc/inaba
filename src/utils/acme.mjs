import {
    existsSync
} from "node:fs";

export const renewKeypair = new Map();
export const renewPathPrefix = "/.well-known/acme-challenge/";

export const dataPathPrefix = new URL("../../data/", import.meta.url);

export function isCertificateReady(serverName) {
    const csrPath = new URL(`${serverName}.csr`, dataPathPrefix);
    if (!existsSync(csrPath)) {
        return false;
    }

    const certPath = new URL(`${serverName}.crt`, dataPathPrefix);
    if (!existsSync(certPath)) {
        return false;
    }

    const keyPath = new URL(`${serverName}.key`, dataPathPrefix);
    if (!existsSync(keyPath)) {
        return false;
    }

    return true;
}
