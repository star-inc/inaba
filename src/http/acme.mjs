import {
    parse as parseUrl
} from "node:url";
import {
    existsSync
} from "node:fs";
import {
    writeFile,
} from "node:fs/promises";

import acme from "acme-client";

import {
    useConfig
} from "../config/index.mjs";

export const renewKeypair = new Map();

export const certsPrefix = new URL("../../ssl_keys/", import.meta.url);

export async function loadCertificate() {
    const { node } = useConfig();
    for (const server of node) {
        const { hosts } = server;
        for (const host of hosts) {
            const url = new URL(host);
            const { hostname: serverName } = url;

            if (!isCertificateExists(serverName)) {
                issueCertificate(serverName)
            }
        }
    }
}

export async function isCertificateExists(serverName) {
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

export function challengeHandler(req, res) {
    const { url: requestedUrl } = req;
    const { pathname } = parseUrl(requestedUrl);

    const acmePrefix = '/.well-known/acme-challenge/'
    if (!pathname.startsWith(acmePrefix)) {
        return false;
    }

    const key = pathname.slice(acmePrefix.length);
    if (!renewKeypair.has(key)) {
        return false;
    }

    res.write(keypair.get(key));
    return true;
}

export async function issueCertificate(acmeClient, serverName) {
    const [key, csr] = await acme.crypto.createCsr({ serverName });
    const csrPath = new URL(`${serverName}.csr`, certsPrefix);

    await Promise.all([
        writeFile(keyPath, key),
        writeFile(csrPath, csr),
    ]);
    await renewCertificate(
        acmeClient,
        serverName,
        csr,
    );
}

export async function renewCertificate(acmeClient, serverName, csr) {
    const cert = await acmeClient.auto({
        termsOfServiceAgreed: true,
        challengeCreateFn,
        challengeRemoveFn,
        csr
    });

    const certPath = new URL(`${serverName}.crt`, certsPrefix)
    await writeFile(certPath, cert);
}

/**
 * Function used to satisfy an ACME challenge
 *
 * @param {object} _authz Authorization object
 * @param {object} challenge Selected challenge
 * @param {string} keyAuthorization Authorization key
 * @returns {Promise}
 */
async function challengeCreateFn(_authz, challenge, keyAuthorization) {
    if (challenge.type !== 'http-01') {
        throw new Error("Unsupported challenge type: " + challenge.type);
    }
    renewKeypair.set(challenge.token, keyAuthorization);
}

/**
 * Function used to remove an ACME challenge response
 *
 * @param {object} authz Authorization object
 * @param {object} challenge Selected challenge
 * @param {string} keyAuthorization Authorization key
 * @returns {Promise}
 */
async function challengeRemoveFn(_authz, challenge, _keyAuthorization) {
    if (challenge.type !== 'http-01') {
        throw new Error("Unsupported challenge type: " + challenge.type);
    }
    renewKeypair.delete(challenge.token);
}
