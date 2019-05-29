import { debuglog } from 'util';
import RippleApiService from './api-v1/services/ripple-api';
import { Server } from './server';
import config from '../.secret_config';

const rippleApiService = new RippleApiService({server: config.server});
console.log('Using rippled server:', config.server);

const server = new Server({rippleApiService});
server.setDebuglog(debuglog);
server.listen().then((port) => {
  console.log('Listening on port:', port);
});

// Important: keeps server running after an exception
process.on('uncaughtException', function (err) {
  console.error('uncaughtException:', err);
  // Example:
  //
  // Error: listen EADDRINUSE: address already in use :::3000
});
