import {
    existsSync
} from "node:fs";

import {
    acmePath,
} from "./data.mjs";

export const renewKeypair = new Map();
export const renewPathPrefix = "/.well-known/acme-challenge/";

export function isCertificateReady(serverName) {
    const csrPath = new URL(`${serverName}.csr`, acmePath);
    if (!existsSync(csrPath)) {
        return false;
    }

    const keyPath = new URL(`${serverName}.key`, acmePath);
    if (!existsSync(keyPath)) {
        return false;
    }

    const certPath = new URL(`${serverName}.crt`, acmePath);
    if (!existsSync(certPath)) {
        return false;
    }

    return true;
}
