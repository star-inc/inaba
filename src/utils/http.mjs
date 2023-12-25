import {
    parse as parseUrl
} from "node:url";

import {
    isObjectPropExists,
} from "./native.mjs";

export function useRouter(prefix) {
    const routeMap = new Map();

    const routeRunner = ({req, res}) => {
        const { method, headers, url: requestedUrl } = req;
        const { host } = headers;
        const { pathname } = parseUrl(requestedUrl);

        if (!pathname.startsWith(prefix)) {
            res.writeHead(400, { 'content-type': 'text/plain' });
            res.write(`Inaba HTTP: Path \"${pathname}\" is malformed to the prefix \"${prefix}\" the router required.`);
            res.end();
            return;
        }

        const prefixRegex = new RegExp(`^(${prefix})`);
        const path = pathname.replace(prefixRegex, "");

        if (!routeMap.has(path)) {
            res.writeHead(404, { 'content-type': 'text/plain' });
            res.write(`Inaba HTTP: Resource on \"${pathname}\" is not found.`);
            res.end();
            return;
        }

        const routeMethod = routeMap.get(path);
        try {
            routeMethod({ method, host, path, req, res });
        } catch (e) {
            res.writeHead(500, { 'content-type': 'text/plain' });
            res.write(`Inaba HTTP: Exception thrown \"${e.message}\"`);
            res.end();
        }
    };

    return { routeMap, routeRunner }
}

export function authNode(req) {
    const nodeKeyRaw = req.headers["x-inaba-key"];
    if (!nodeKeyRaw) {
        throw new Error("node key is not provided");
    }

    const nodeKey = md5hex(nodeKeyRaw);
    const {node_map: nodeMap} = useConfig();
    if (!isObjectPropExists(nodeMap, nodeKey)) {
        throw new Error("node key is not found");
    }

    return {
        name: nodeMap[nodeKey],
        key: nodeKey,
    };
}
