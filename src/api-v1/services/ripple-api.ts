import { NextHandleFunction } from 'connect';
import { NextFunction } from 'express';
import * as http from "http";
import { debuglog } from 'util';

import { RippleAPI } from 'ripple-lib';
import { APIOptions } from 'ripple-lib/dist/npm/api';

// Set NODE_DEBUG=ripple-api for debug logs
const debug = debuglog('ripple-api');

class RippleApiService {
  public api: RippleAPI;

  public constructor(options: APIOptions) {
    if (typeof options.server != 'string') {
      console.error('[CONFIG] Missing required field: `server`. Check `.secret_config.js`.');
      process.exit(1);
    }
    
    this.api = new RippleAPI(options);
    
    // WebSocket error handler
    this.api.on('error', (errorCode, errorMessage) => {
      console.log(`[WebSocket Error] ${errorCode}: ${errorMessage}`);
      // [WebSocket Error] websocket: read EHOSTUNREACH
      // Disconnected from rippled. Code: 1006
      if (this.api.isConnected()) {
        debug('Still connected to rippled.');
      } else {
        debug('Reconnecting...');
        this.connectWithRetry();
      }
    });
    
    this.api.on('connected', () => {
      debug('Connected to rippled.');
      this.api.getLedgerVersion().then(v => {
        console.log('Ledger version:', v.toLocaleString());
      });
    });
    
    this.api.on('disconnected', code => {
      console.log('Disconnected from rippled. Code:', code);
      // code === 1000 : normal disconnection
    });
    
    this.connectWithRetry();
  }

  private connectWithRetry(): void {
    const timestamp = new Date().toUTCString() + ' |';
    this.api.connect().then(() => {
      this.api.getLedgerVersion().then(v => {
        console.log('Initial connect - ledger version:', v.toLocaleString());
      });
    }).catch(error => {
      if (error.name === 'RippledNotInitializedError') {
        console.log(timestamp, 'rippled server is not yet initialized. Will retry in 1 second...');
        setTimeout(this.connectWithRetry.bind(this), 1000);
      } else if (error.data && error.data.code === 'ECONNREFUSED') {
        // NotConnectedError: connect ECONNREFUSED 127.0.0.1:6006
        //     at Connection._onOpenError ...
        console.log(timestamp, 'rippled server is not running. Check your config. Will retry in 2 seconds...');
        setTimeout(this.connectWithRetry.bind(this), 2000);
      } else {
        console.log(error);
        console.log(timestamp, 'Failed to connect:', error);
        console.log('Will retry in 1 second...');
        setTimeout(this.connectWithRetry.bind(this), 1000);
      }
    });
  }

  // Connect before every API call
  public connectHandleFunction(): NextHandleFunction {
    return (req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction): void => {
      const request = req as MessageWithPath;
      // Whitelist paths that do not strictly require rippled
      if (request.path === '/v1/apiDocs') {
        return next();
      }
      this.api.connect().then(() => {
        return next();
      }).catch(err => { // Important: catch connect() errors, or you'll have an unhandled promise rejection
        // Whitelist paths that would like rippled, but still work without it
        if (request.path === '/v1/servers/info') {
          return next();
        }
        debug('connectHandleFunction() caught err:', err);
        if (err.name === 'NotConnectedError') {
          err.message = 'XRP Server is unable to connect to the rippled server';
        }
        return next(err);
      });
    };
  }
}

interface MessageWithPath extends http.IncomingMessage {
  path: string;
}

export default RippleApiService;
