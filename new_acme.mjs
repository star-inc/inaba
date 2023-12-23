import "./src/config/load.mjs";

import {
    existsSync,
} from "node:fs";
import {
    writeFile,
} from "node:fs/promises";

import {
    useConfig,
} from "./src/config/index.mjs";

import {
    certsPrefix
} from "./src/utils/acme.mjs";
import {
    md5hex,
} from "./src/utils/native.mjs";

import acme from "acme-client";

(async () => {
    const { acme: acmeConfig } = useConfig();

    const directoryUrl = acmeConfig.directory_url;
    const directoryUrlMd5 = md5hex(directoryUrl);

    const accountKeyPath = new URL(`account_${directoryUrlMd5}.key`, certsPrefix);
    if (existsSync(accountKeyPath)) {
        console.error(
            `ACME Account on ${directoryUrl}`,
            "has been register."
        )
        return;
    }

    const accountKey = await acme.crypto.createPrivateKey();
    await writeFile(accountKeyPath, accountKey);

    const client = new acme.Client({ directoryUrl, accountKey });
    if (!acmeConfig.contact.length) {
        await client.createAccount({
            termsOfServiceAgreed: true,
            contact: acmeConfig.contact,
        });
    }

    console.log(
        `ACME account on ${acmeConfig.directory_url}`,
        "have been register successfully."
    );
})()
