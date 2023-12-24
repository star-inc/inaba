import {
    parse as parseUrl
} from "node:url";

import {
    renewKeypair,
    renewPathPrefix,
} from "../utils/acme.mjs";

export function onRequest(req, res) {
    const { headers, url: requestedUrl } = req;
    const { host } = headers;
    const { pathname } = parseUrl(requestedUrl);

    if (!pathname.startsWith(renewPathPrefix)) {
        res.writeHead(302, {
            'location': `https://${host}${pathname}`
        })
        res.write("Inaba ACME: HTTPS redirect automatically.");
        res.end();
        return;
    }

    const renewPathPrefixRegex = new RegExp(`^(${renewPathPrefix})`);
    const code = pathname.replace(renewPathPrefixRegex, "");
    if (!renewKeypair.has(code)) {
        res.writeHead(404, {
            'content-type': 'text/plain'
        })
        res.write("Inaba ACME: Code is not found.");
        res.end();
        return;
    }

    res.writeHead(200, {
        'content-type': 'text/plain'
    })
    res.write(renewKeypair.get(code));
    res.end();
}
