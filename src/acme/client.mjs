import {
    existsSync,
    readFileSync,
} from "node:fs";
import {
    readFile,
    writeFile,
} from "node:fs/promises";

import {
    useConfig,
} from "../config/index.mjs";

import {
    challengeKeypair,
} from "../utils/acme.mjs";
import {
    acmePath,
} from "../utils/data.mjs";

import acme from "acme-client";

export const useClient = () => {
    const { acme: acmeConfig } = useConfig();
    const directoryUrl = acmeConfig.directory_url;
    const accountUrl = acmeConfig.account_url;

    const accountKeyPath = new URL("account.key", acmePath);
    const accountKey = readFileSync(accountKeyPath);

    const externalAccountBinding = {
        kid: acmeConfig.eab_kid,
        hmacKey: acmeConfig.eab_hmac_key,
    };

    return new acme.Client({
        directoryUrl,
        accountUrl,
        accountKey,
        externalAccountBinding,
    });
}

export async function getKeypair(serverName) {
    const keyPath = new URL(`${serverName}.key`, acmePath);
    const csrPath = new URL(`${serverName}.csr`, acmePath);

    if (existsSync(keyPath) && existsSync(csrPath)) {
        const [key, csr] = await Promise.all([
            readFile(keyPath),
            readFile(csrPath),
        ]);
        return { key, csr };
    }

    const [key, csr] = await acme.crypto.createCsr({
        commonName: serverName,
    });
    await Promise.all([
        writeFile(keyPath, key),
        writeFile(csrPath, csr),
    ]);

    return { key, csr };
}

export async function issueCertificate(serverName) {
    const { csr } = await getKeypair(serverName);
    const client = useClient();

    const certIssueAt = new Date().getTime().toString();
    const certContent = await client.auto({
        termsOfServiceAgreed: true,
        challengeCreateFn,
        challengeRemoveFn,
        csr
    });

    const timePath = new URL(`${serverName}.stamp`, acmePath);
    const certPath = new URL(`${serverName}.crt`, acmePath);
    await Promise.all([
        writeFile(timePath, certIssueAt),
        writeFile(certPath, certContent),
    ]);

    return {
        certIssueAt,
        certContent,
    };
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
        throw new Error(`unsupported challenge type: \"${challenge.type}\"`);
    }
    challengeKeypair.set(challenge.token, keyAuthorization);
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
        throw new Error(`unsupported challenge type: \"${challenge.type}\"`);
    }
    challengeKeypair.delete(challenge.token);
}
