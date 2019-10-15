// Usage: node dist/server.js 3000
//   Replace 3000 with the desired port

import { debuglog } from 'util';
import '@babel/polyfill'; // For async functions
import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initialize } from 'express-openapi';
import path from 'path';
import RippleApiService from './api-v1/services/ripple-api';
import { ERRORS } from './errors';

interface ServerOptions {
  rippleApiService: RippleApiService;
  debuglog?: typeof debuglog;
}

export class Server {
  private pathDebug: ReturnType<typeof debuglog>;
  private serverDebug: ReturnType<typeof debuglog>;
  private app: express.Application;

  public constructor(options: ServerOptions) {
    const rippleApiService = options.rippleApiService;
    this.serverDebug = (options.debuglog || debuglog)('server');
    this.pathDebug = (options.debuglog || debuglog)('paths');
    
    this.app = express();

    // Use first: simple response logger
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.on('finish', () => {
        if (res.statusCode >= 100 && res.statusCode < 300) {
          // Green for 1xx and 2xx
          this.serverDebug('\x1b[32m%s\x1b[0m', req.method.toUpperCase() + ' ' + req.originalUrl + ' ' + res.statusCode);
        } else {
          // Red for the rest
          this.serverDebug('\x1b[31m%s\x1b[0m', req.method.toUpperCase() + ' ' + req.originalUrl + ' ' + res.statusCode);
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
        log: this.pathDebug
      },
      paths: path.resolve(__dirname, '../dist/api-v1/paths/'), // Only supports .js files, not .ts
      promiseMode: true // Required to use promises in operations
    });

    interface ServerError {
      status?: number;
      errors: ServerError[];
      // ...
    };

    // Error handler for business logic
    this.app.use((err: ServerError, req: Request, res: Response, next: NextFunction) => {
      this.serverDebug('Server error:', err);
      // Error: [TimeoutError()]
      // (node:40986) [DEP0079] DeprecationWarning: Custom inspection function on Objects via .inspect() is deprecated
      // GET /v1/accounts/rHn1DJH1dqzdZ5PrkFpgQPn6Tbn8wKsrk9/transactions 500
      // [WebSocket Error] websocket: read EHOSTUNREACH
      // Disconnected from rippled. Code: 1006
      if (res.headersSent) {
        this.serverDebug('headers were previously sent, not responding with error');
        return next(err);
      }

      const status = err.status || 500;
      delete err.status;
      if (!err.errors) {
        err = {errors: [err]};
      }
      res.status(status).json(err);
    });

    this.app.use(function(req, res, next){
      res.status(404);
      const error: any = {}
      if (req.path.startsWith('/v1') === false) {
        error.code = ERRORS.CODES.MISSING_V1
        error.message = 'Missing version prefix in path';
        error.hint = 'Try starting the path with `/v1`'
      } else {
        error.code = ERRORS.CODES.NOT_FOUND
        error.message = 'Path not found'
        error.hint = 'Ensure that all path parameters are supplied'
      }
      res.send({ message: 'Not found', errors: [error] });
    });
  }

  public listen(): Promise<number> {
    return new Promise((resolve) => {
      const port = parseInt(process.argv[2], 10) || 3000;
      this.app.listen(port, function() {
        resolve(port);
      });
    });
  }

  public expressApp(): Application {
    return this.app;
  }
}
