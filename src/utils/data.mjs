import {
    existsSync,
    mkdirSync,
} from "node:fs";

import {
    useConfig,
} from "../config/index.mjs";

import {
    md5hex,
} from "./native.mjs";

function autoCreateDirectory(path) {
    if (existsSync(path)) {
        return;
    }

    mkdirSync(path, {
        recursive: true,
    })
}

export const dataPath = new URL("../../data/", import.meta.url);
autoCreateDirectory(dataPath);

export const acmeId = (() => {
    const { acme: acmeConfig } = useConfig();
    const { directory_url: directoryUrl } = acmeConfig;

    return md5hex(directoryUrl);
})();

export const acmePath = new URL(`acme_${acmeId}/`, dataPath);
autoCreateDirectory(acmePath);
