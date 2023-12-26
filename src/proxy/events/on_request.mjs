import {
    useConfig
} from "../../config/index.mjs";

import {
    authNode,
    useRouter
} from "../../utils/http.mjs";

import {
    getCredential,
} from "../protocol.mjs";

import {
    relayHttp,
} from "../../bottle/index.mjs";
import {
    sessionPoolNode
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

routeMap.set("certificates", ({ method, req, res }) => {
    if (method !== "GET") {
        res.writeHead(405, { 'content-type': 'text/plain' });
        res.write("Inaba Proxy: Method not allowed.");
        res.end();
        return;
    }

    try {
        const { serverNames } = authNode(req);
        const credentials = serverNames.map((sn) => ({sn, ...getCredential(sn)}));
        res.writeHead(200, { 'content-type': 'application/json' });
        res.write(JSON.stringify(credentials.map(({sn, cert, key}) => ({
            name: sn,
            cert: cert.toString(),
            key: key.toString(),
        }))));
        res.end();
    } catch (e) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        res.write(`Inaba Proxy: \"${e.message}\".`);
        res.end();
    }
});

function relayRunner({ req, res, host }) {
    const { node_map: nodeMap } = useConfig();

    const node = Object.
        entries(nodeMap).
        find(([_, v]) => v.includes(host));
    if (!node) {
        res.writeHead(512, { 'content-type': 'text/plain' });
        res.write(`Inaba Proxy: Host \"${host}\" is unmanaged by Inaba Network.`);
        res.end();
        return;
    }

    const [nodeKey] = node;
    if (!sessionPoolNode.has(nodeKey)) {
        res.writeHead(502, { 'content-type': 'text/plain' });
        res.write(`Inaba Proxy: Remote node \"${host}\" has been disconnected from Inaba Network.`);
        res.end();
        return;
    }

    const nodeSession = sessionPoolNode.get(nodeKey);
    relayHttp(nodeSession, req, res);
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
