import {
  useConfig,
} from '../config/index.mjs';

import {
  useHttp,
  useHttps,
} from './protocol.mjs'

import {
  onRequest,
  onUpgrade,
} from './request.mjs';

const {
  app_server: appServerConfig
} = useConfig();

const {
  is_secure: isSecure
} = appServerConfig;

export const appServer = !isSecure ?
  useHttp() :
  useHttps();

appServer.on('request', onRequest);
appServer.on('upgrade', onUpgrade);
