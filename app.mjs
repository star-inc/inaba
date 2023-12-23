import "./src/config/load.mjs";

import {
    useConfig,
} from "./src/config/index.mjs";

import {
    useServer as useAcmeServer,
    loadCertificates,
} from './src/acme/server.mjs';

import {
    useServer as useProxyServer,
} from './src/proxy/server.mjs';

const {
    proxy: proxyConfig,
} = useConfig();

const {
    is_acme_enabled: isAcmeEnabled,
} = proxyConfig;

if (!isAcmeEnabled) {
    const proxy = useProxyServer(false);
    proxy.listen(80);
} else {
    const acmeServer = useAcmeServer();
    acmeServer.listen(80);

    loadCertificates().then(() => {
        const proxy = useProxyServer(true);
        proxy.listen(443);
    })
}
