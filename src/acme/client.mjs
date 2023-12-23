import {
    existsSync
} from "node:fs";
import {
    readFile,
    writeFile,
} from "node:fs/promises";

import {
    useConfig,
} from "../config/index.mjs";

import acme from "acme-client";

export const useClient = () => {
    return new acme.Client({
    
    })
}

export async function getCSR(serverName) {
    const csrPath = new URL(`${serverName}.csr`, certsPrefix);
    if (existsSync(certsPrefix)) {
        return await readFile(csrPath);
    }

    const [key, csr] = await acme.crypto.createCsr({
        serverName,
    });
    await Promise.all([
        writeFile(keyPath, key),
        writeFile(csrPath, csr),
    ]);

    return csr;
}

export async function issueCertificate(serverName) {
    const csr = await getCSR(serverName);

    const cert = await client.auto({
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
