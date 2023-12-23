import "./src/config/load.mjs";

import {
    useConfig
} from "./src/config/index.mjs";

import {
    appServer
} from './src/http/server.mjs';

import {
    checkHostCertificate,
} from './src/http/acme.mjs';

import acme from 'acme-client';

const {
    app_server: appServerConfig
} = useConfig();

const {
    is_acme_enabled: isAcmeSecure,
} = appServerConfig;

if (isAcmeSecure) {
    const {
        ca_provider: provider,
        ca_stage: stage,
    } = useConfig();

    const acmeClient = new acme.Client({
        directoryUrl: acme.directory[provider][stage],
        accountKey: accountPrivateKey
    });

    const notReadyHosts = checkHostCertificate(acmeClient);
    if (notReadyHosts.length) {
        
    }
}

appServer.listen(80);
