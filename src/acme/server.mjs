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
} from './events.mjs';

export const useServer = () => {
  const server = useHttp();
  server.on('request', onRequest);
  return server;
}

export const loadCertificateProxy = async () => {
  const { proxy: proxyConfig } = useConfig();
  const serverName = proxyConfig.entrypoint_host;

  if (isCertificateReady(serverName)) {
    return;
  }

  console.info(`[ACME Initialize] Issuing certificate for proxy \"${serverName}\".`);
  await issueCertificate(serverName);
  console.info(`[ACME Initialize] Issued certificate for proxy \"${serverName}\".`);
}

export const loadCertificateNodes = () => {
  const { node_map: nodeMap } = useConfig();
  const serverNames = Object.values(nodeMap).flat();

  return Promise.all(serverNames.
    filter((serverName) => !isCertificateReady(serverName)).
    map(async (serverName) => {
      console.info(`[ACME Initialize] Issuing certificate for node \"${serverName}\".`);
      await issueCertificate(serverName);
      console.info(`[ACME Initialize] Issued certificate for node \"${serverName}\".`);
    })
  );
}

export const loadCertificateRenewals = () => {
  const {
    proxy: proxyConfig,
    node_map: nodeMap,
  } = useConfig();

  const serverNames = [
    proxyConfig.entrypoint_host,
    ...Object.values(nodeMap).flat(),
  ];

  for (const serverName of serverNames) {
    scheduleCertificateRenewal(serverName);
  }
};
