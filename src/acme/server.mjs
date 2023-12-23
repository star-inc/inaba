import {
  useConfig,
} from "../config/index.mjs";

import {
  isCertificateReady,
  scheduleCertificateRenewal,
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
  const server = useHttp();
  server.on('request', onRequest);
  return server;
}

export const loadCertificateFiles = () => {
  const {
    proxy: proxyConfig,
    node_map: nodeMap,
  } = useConfig();

  const serverNames = [
    proxyConfig.entrypoint_host,
    ...Object.keys(nodeMap),
  ];

  return Promise.all(serverNames.
    filter((serverName) => !isCertificateReady(serverName)).
    map((serverName) => issueCertificate(serverName))
  );
}

export const loadCertificateRenewals = () => {
  const {
    proxy: proxyConfig,
    node_map: nodeMap,
  } = useConfig();

  const serverNames = [
    proxyConfig.entrypoint_host,
    ...Object.keys(nodeMap),
  ];

  for (const serverName of serverNames) {
    scheduleCertificateRenewal(serverName);
  }
};
