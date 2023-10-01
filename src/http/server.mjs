import {
  useConfig,
} from '../config/index.mjs';

import {
  useHttp,
  useHttps
} from './protocols.mjs'

import {
  onRequest,
  onUpgrade
} from './handlers.mjs';

const config = useConfig();
export const server = !config.secure ?
  useHttp() :
  useHttps();

server.on('request', onRequest);
server.on('upgrade', onUpgrade);
