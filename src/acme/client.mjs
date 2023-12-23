import {
    existsSync,
    mkdirSync,
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
    renewKeypair,
    dataPathPrefix,
} from "../utils/acme.mjs";
import {
    md5hex,
} from "../utils/native.mjs";

import acme from "acme-client";

export const useClient = () => {
    const { acme: acmeConfig } = useConfig();

    const directoryUrl = acmeConfig.directory_url;
    const directoryUrlMd5 = md5hex(directoryUrl);
    const directoryDataPath = new URL(`${directoryUrlMd5}/`, dataPathPrefix);

    const accountKeyPath = new URL(`account.key`, directoryDataPath);
    const accountKey = readFileSync(accountKeyPath);

    const client = new acme.Client({ directoryUrl, accountKey });
    return {client, directoryDataPath};
}

export async function getKeypair(serverName) {
    const keypairPath = new URL(`keypair/`, dataPathPrefix);
    if (!existsSync(keypairPath)) {
        mkdirSync(keypairPath, {
            recursive: true,
        })
    }

    const keyPath = new URL(`${serverName}.key`, keypairPath);
    const csrPath = new URL(`${serverName}.csr`, keypairPath);

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
    const {
        client,
        directoryDataPath,
    } = useClient();

    const timestamp = new Date().getTime();
    const cert = await client.auto({
        termsOfServiceAgreed: true,
        challengeCreateFn,
        challengeRemoveFn,
        csr
    });

    const timePath = new URL(`${serverName}.stamp`, directoryDataPath);
    const certPath = new URL(`${serverName}.crt`, directoryDataPath);
    await Promise.all([
        writeFile(timePath, timestamp),
        writeFile(certPath, cert),
    ]);
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
