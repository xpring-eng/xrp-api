import RippleApiService from './api-v1/services/ripple-api';
import { Server } from './server';
import config from '../.secret_config';

const rippleApiService = new RippleApiService({server: config.server});
console.log('Using rippled server:', config.server);

const server = new Server({rippleApiService});
server.listen().then((port) => {
  console.log('Listening on port:', port);
});

// Important: keeps server running after an exception
process.on('uncaughtException', function (err) {
  console.error('uncaughtException:', err);
  // Example:
  //
  // Error: listen EADDRINUSE: address already in use :::3000
  //
  // Error: connect ECONNREFUSED 127.0.0.1:6006
  // at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1054:14) {
  //   errno: 'ECONNREFUSED',
  //   code: 'ECONNREFUSED',
  //   syscall: 'connect',
  //   address: '127.0.0.1',
  //   port: 6006
  // }
});
