import {
    parse as parseUrl
} from "node:url";

import {
    useConfig
} from "../config/index.mjs";

import {
    challengeHandler,
} from "./acme.mjs";

import {
    wsPool,
    wsServer
} from '../websocket/server.mjs';

import {
    register,
} from '../websocket/bottle.mjs';

export function onRequest(req, res) {
    if (challengeHandler(req, res)) {
        res.end();
        return;
    }

    const { headers } = req;
    const { entrypoint } = useConfig();
    if (headers.host === entrypoint.host) {
        res.writeHead(418, {
            'content-type': 'text/html'
        })
        res.write(`
            Inaba Network <br />
            <a href="https://github.com/star-inc/inaba" target="_blank">
                https://github.com/star-inc/inaba
            </a>
        `);
        res.end();
        return;
    }

    const { nodes } = useConfig();
    const profile = Object.entries(nodes).
        find((i) => i[1].hosts.includes(headers.host));

    if (!profile) {
        res.writeHead(512, {
            'content-type': 'text/html'
        })
        res.write(`
            Host \"${headers.host}\"
            is unmanaged by Inaba Network.
        `);
        res.end();
        return;
    }

    if (!wsPool.has(profile[0])) {
        res.writeHead(502, {
            'content-type': 'text/html'
        })
        res.write(`
            Remote node \"${headers.host}\"
            has been disconnected from Inaba Network.
        `);
        res.end();
        return;
    }

    const ws = wsPool.get(profile[0]);
    register(ws, req, res);
}

export function onUpgrade(req, socket, head) {
    const { headers, url: requestedUrl } = req;

    const { host } = headers;
    const { pathname } = parseUrl(requestedUrl);
    const { entrypoint, nodes } = useConfig();

    if (host === entrypoint.host && pathname === entrypoint.path) {
        const key = req.headers["x-inaba-key"];

        if (!(key in nodes)) {
            socket.destroy();
            return;
        }

        wsServer.handleUpgrade(req, socket, head, function done(ws) {
            wsServer.emit('connection', ws, req);
            wsPool.set(key, ws);
        });
        return
    }

    socket.destroy();
}
