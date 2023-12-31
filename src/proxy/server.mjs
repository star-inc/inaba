import {
  useHttp,
  useHttps,
} from './protocol.mjs'

import onRequest from './events/on_request.mjs';
import onUpgrade from './events/on_upgrade.mjs';

export const useServer = (isHTTPS) => {
  const server = !isHTTPS ?
    useHttp() :
    useHttps();
  
  server.on('request', onRequest);
  server.on('upgrade', onUpgrade);

  return server;
}
