import {
  useHttp,
  useHttps,
} from './protocol.mjs'

import {
  onRequest,
  onUpgrade,
} from './event.mjs';

export const useServer = (isHTTPS) => {
  const server = !isHTTPS ?
    useHttp() :
    useHttps();
  
  server.on('request', onRequest);
  server.on('upgrade', onUpgrade);

  return server;
}
