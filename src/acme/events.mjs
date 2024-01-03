import {
    parse as parseUrl
} from "node:url";

import {
    challengeKeypair,
    challengePathPrefix,
} from "../utils/acme.mjs";

export function onRequest(req, res) {
    const { headers, url: requestedUrl } = req;
    const { host } = headers;
    const { pathname } = parseUrl(requestedUrl);

    if (!pathname.startsWith(challengePathPrefix)) {
        res.writeHead(302, {
            'location': `https://${host}${pathname}`
        })
        res.write("Inaba ACME: HTTPS redirect automatically.");
        res.end();
        return;
    }

    const challengePathPrefixRegex = new RegExp(`^(${challengePathPrefix})`);
    const challengeToken = pathname.replace(challengePathPrefixRegex, "");
    if (!challengeKeypair.has(challengeToken)) {
        res.writeHead(404, { 'content-type': 'text/plain' })
        res.write("Inaba ACME: Token is not found.");
        res.end();
        return;
    }

    const challengeKey = challengeKeypair.get(challengeToken);
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.write(challengeKey);
    res.end();
}
