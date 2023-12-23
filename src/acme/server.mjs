import {
  useConfig,
} from "../config/index.mjs";

import {
  isCertificateReady
} from "../utils/acme.mjs";

import {
  issueCertificate
} from "./client.mjs";

import {
  useHttp,
} from './protocol.mjs';

import {
  onRequest,
} from './request.mjs';

export const useServer = () => {
  const {
      proxy_server: proxyServerConfig,
      nodes,
  } = useConfig();

  const serverNames = [
    proxyServerConfig.entrypoint_host,
    ...nodes,
  ]
  for (const serverName in serverNames) {
      if (!isCertificateReady(serverName)) {
          issueCertificate(serverName)
      }
  }

  const server = useHttp();
  server.on('request', onRequest);
  return server;
}
