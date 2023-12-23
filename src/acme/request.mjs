import {
    parse as parseUrl
} from "node:url";

import {
    renewKeypair,
    renewPathPrefix,
} from "../utils/acme.mjs";

export function onRequest(req, res) {
    const { url: requestedUrl } = req;
    const { pathname } = parseUrl(requestedUrl);

    if (!pathname.startsWith(renewPathPrefix)) {
        res.writeHead(400, {
            'content-type': 'text/plain'
        })
        res.write("Inaba ACME: Bad Request");
        res.end();
        return;
    }

    const code = pathname.replace(`/^(${renewPathPrefix})/`, "");
    if (!renewKeypair.has(code)) {
        res.writeHead(404, {
            'content-type': 'text/plain'
        })
        res.write("Inaba ACME: Code Not Found");
        res.end();
        return;
    }

    res.writeHead(200, {
        'content-type': 'text/plain'
    })
    res.write(renewKeypair.get(code));
    res.end();
}
