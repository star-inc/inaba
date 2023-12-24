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
export const renewTime = 5184000000;

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

    const stampPath = new URL(`${serverName}.stamp`, acmePath);
    if (!existsSync(stampPath)) {
        return false;
    }

    const currentTime = new Date().getTime();
    const certIssueAt = parseInt(readFileSync(stampPath));
    if (currentTime > certIssueAt + renewTime) {
        return false;
    }

    return true;
}

export function scheduleCertificateRenewal(serverName, certIssueAt = -1) {
    if (certIssueAt === -1) {
        const timePath = new URL(`${serverName}.stamp`, acmePath);
        certIssueAt = parseInt(readFileSync(timePath));
    }

    const expiryDate = new Date(certIssueAt + renewTime)
    const expiryHandler = async () => {
        console.info(`[ACME Renewal] Issuing certificate for \"${serverName}\".`)
        await issueCertificate(serverName);
        console.info(`[ACME Renewal] Issued certificate for \"${serverName}\".`)
    }
    scheduleJob(expiryDate, expiryHandler);
}
