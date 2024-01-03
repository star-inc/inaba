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
    acmePath,
} from "./src/utils/data.mjs";

import acme from "acme-client";

(async () => {
    const { acme: acmeConfig } = useConfig();
    const { directory_url: directoryUrl } = acmeConfig;

    const accountKeyPath = new URL("account.key", acmePath);
    if (existsSync(accountKeyPath)) {
        console.error(
            `ACME Account on ${directoryUrl}`,
            "had been register."
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

    console.info(
        `ACME account on ${acmeConfig.directory_url}`,
        "has been register successfully."
    );
})()
