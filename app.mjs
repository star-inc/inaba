import "./src/config/load.mjs";

import {
    useConfig
} from "./src/config/index.mjs";

import {
    server
} from './src/http/server.mjs';

const {
    port: serverPort,
    hostname: serverHostname
} = useConfig();

server.listen(
    serverPort,
    serverHostname,
);
