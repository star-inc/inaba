import {
    existsSync,
    readFileSync,
} from "node:fs";

import {
    scheduleJob
} from "node-schedule";

import {
    issueCertificate
} from "../acme/client.mjs";

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

export function scheduleCertificateRenewal(serverName, certIssueAt = -1) {
    if (certIssueAt === -1) {
        const timePath = new URL(`${serverName}.stamp`, acmePath);
        certIssueAt = parseInt(readFileSync(timePath));
    }

    const expiryDate = new Date(certIssueAt + 5184000000)
    const expiryHandler = () => issueCertificate(serverName);
    scheduleJob(expiryDate, expiryHandler,);
}
