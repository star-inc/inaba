import {
    useConfig
} from "../../config/index.mjs";

import {
    authNode,
    useRouter
} from "../../utils/http.mjs";

import {
    getCredentials,
} from "../protocol.mjs";

import {
    relayHttp,
} from "../../bottle/index.mjs";
import {
    sessionPool
} from "../../bottle/server.mjs";

const {
    proxy: proxyConfig,
} = useConfig();

const {
    entrypoint_path: entrypointPath,
} = proxyConfig;

const { routeMap, routeRunner } = useRouter(entrypointPath);

routeMap.set("", ({ res }) => {
    res.writeHead(418, { 'content-type': 'text/html' })
    res.write(`
        Inaba Network <br />
        <a href="https://github.com/star-inc/inaba" target="_blank">
            https://github.com/star-inc/inaba
        </a>
    `);
    res.end();
});

routeMap.set("certificate", ({method, req, res}) => {
    if (method !== "GET") {
        res.writeHead(405, { 'content-type': 'text/plain' });
        res.write("Inaba Proxy: Method not allowed.");
        res.end();
        return;
    }

    try {
        const {serverName} = authNode(req);
        const credentials = getCredentials(serverName);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.write(JSON.stringify(credentials));
        res.end();
    } catch (e) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        res.write(`Inaba Proxy: \"${e.message}\".`);
        res.end();
    }
});

function relayRunner({ req, res, host }) {
    const { node_map: nodeMap } = useConfig();
    const nodeKey = nodeMap[host];
    if (!nodeKey) {
        res.writeHead(512, { 'content-type': 'text/plain' });
        res.write(`Inaba Proxy: Host \"${host}\" is unmanaged by Inaba Network.`);
        res.end();
        return;
    }
    if (!sessionPool.has(nodeKey)) {
        res.writeHead(502, { 'content-type': 'text/plain' });
        res.write(`Inaba Proxy: Remote node \"${host}\" has been disconnected from Inaba Network.`);
        res.end();
        return;
    }

    const ws = sessionPool.get(nodeKey);
    relayHttp.call(ws, req, res);
}

export default function onRequest(req, res) {
    const { headers } = req;
    const { host } = headers;

    const { proxy: proxyConfig } = useConfig();
    const { entrypoint_host: entrypointHost } = proxyConfig;

    if (host === entrypointHost) {
        routeRunner({ req, res });
    } else {
        relayRunner({ req, res, host });
    }
}
