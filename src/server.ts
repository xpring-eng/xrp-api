// Usage: node dist/server.js 3000
//   Replace 3000 with the desired port

import '@babel/polyfill'; // For async functions
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initialize } from 'express-openapi';
import path from 'path';
import RippleApiService from './api-v1/services/ripple-api';

type ServerOptions = {
  rippleApiService: RippleApiService
}

export class Server {
  pathDebug: any
  debug: any
  app: express.Application

  constructor(options: ServerOptions) {
    const rippleApiService = options.rippleApiService;
    this.app = express();

    // Use first: simple response logger
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.on('finish', () => {
        if (res.statusCode >= 100 && res.statusCode < 300) {
          // Green for 1xx and 2xx
          this.debug('\x1b[32m%s\x1b[0m', req.method.toUpperCase() + ' ' + req.originalUrl + ' ' + res.statusCode);
        } else {
          // Red for the rest
          this.debug('\x1b[31m%s\x1b[0m', req.method.toUpperCase() + ' ' + req.originalUrl + ' ' + res.statusCode);
        }
      });
      next();
    });

    // Connect to rippled before every API call
    this.app.use(rippleApiService.connectHandleFunction());

    this.app.use(cors());
    this.app.use(bodyParser.json());

    initialize({
      app: this.app,
      apiDoc: './api-doc.yml',
      dependencies: {
        api: rippleApiService.api, // RippleAPI instance
        log: this.pathHandlerLog
      },
      paths: path.resolve(__dirname, '../dist/api-v1/paths/'), // Only supports .js files, not .ts
      promiseMode: true // Required to use promises in operations
    });

    // Error handler for business logic
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      this.debug('Error:', err);
      if (res.headersSent) {
        this.debug('headers were previously sent, not responding with error');
        return next(err);
      }

      const status = err.status || 500;
      delete err.status;
      if (!err.errors) {
        err = {errors: [err]};
      }
      res.status(status).json(err);
    });
  }

  setDebuglog(debuglog: Function) {
    // Set NODE_DEBUG=server for debug logs
    this.debug = debuglog('server');

    this.pathDebug = debuglog('paths');
  }

  // Must use arrow function to preserve `this`
  pathHandlerLog = (...args: string[]) => {
    this.pathDebug(...args);
  }

  listen(): Promise<number> {
    return new Promise((resolve) => {
      const port = parseInt(process.argv[2], 10) || 3000;
      this.app.listen(port, function() {
        resolve(port);
      });
    });
  }
}
