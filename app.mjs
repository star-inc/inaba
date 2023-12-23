import "./src/config/load.mjs";

import {
    useConfig,
} from "./src/config/index.mjs";

import {
    useServer as useAcmeServer,
} from './src/acme/server.mjs';

import {
    useServer as useProxyServer,
} from './src/proxy/server.mjs';

const {
    proxy_server: proxyServerConfig,
} = useConfig();

const {
    is_acme_enabled: isAcmeEnabled,
} = proxyServerConfig;

if (!isAcmeEnabled) {
    useProxyServer(false).listen(80);
} else {
    useAcmeServer().listen(80);
    useProxyServer(true).listen(443);
}
