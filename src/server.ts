// Usage: node dist/server.js 3000
//   Replace 3000 with the desired port

import { debuglog } from 'util';
import express, { Request, Response, NextFunction, Application, RequestHandler } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initialize } from 'express-openapi';
import path from 'path';
import RippleApiService from './api-v3/services/ripple-api';
import { ERRORS } from './errors';
import { ValidatableResponse } from "./types";
import { FormattedSubmitResponse } from "ripple-lib/dist/npm/transaction/submit";
import { Prepare } from "ripple-lib/dist/npm/transaction/types";

interface ServerOptions {
  rippleApiService: RippleApiService;
  debuglog?: typeof debuglog;
}

interface ErrorsResponse {
  message: string;
  errors: Error[];
}

type ResponseValidation = {
  errors: {
    errorCode: string, // e.g. "additionalProperties.openapi.responseValidation"
    message: string, // e.g. "account_data should NOT have additional properties"
    path: string // e.g. "account_data"
  }[],
  message: 'The response was not valid.'
} | undefined;

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
    // this.app.use(rippleApiService.connectHandleFunction());
    // TODO: replace with ripple-lib functionality

    this.app.use(cors());
    this.app.use(bodyParser.json());

    /**
     * Transform errors and validate all responses
     */
    const validateAllResponses = (req: Request, res: ValidatableResponse, next: NextFunction) => {
      if (process.env.NODE_ENV != 'production') {
        const send = res.send;
        const resJson = res.json;
        const log = this.pathDebug;

        const expressOpenAPISendOrJson = (sendOrJson: Function, args: any): ValidatableResponse => {
          if (res.get('x-express-openapi-validation-error-for') !== undefined) {
            return sendOrJson.apply(res, args);
          }
          const body = args[0];
          if (typeof res.validateResponse !== 'function') {
            if (body.errors && body.errors[0].code !== 404) {
              console.error('TypeError: res.validateResponse is not a function. Check `api-doc.yml`.');
            }
            return sendOrJson.apply(res, args);
          }
          let validation: ResponseValidation = res.validateResponse(res.statusCode, body) as ResponseValidation;
          if (validation) {
            // red
            log('\x1b[31m%s\x1b[0m', `${res.req ? decodeURI(res.req.path) : ''} validation:`, validation);

            // Set to avoid a loop, and to provide the original status code
            res.set('x-express-openapi-validation-error-for', res.statusCode.toString());
          } else {
            // green
            log('\x1b[32m%s\x1b[0m', `${res.req ? decodeURI(res.req.path) : ''} response validated`);
          }
          return sendOrJson.apply(res, args);
        }

        res.send = function expressOpenAPISend(...args) {
          return expressOpenAPISendOrJson(send, args);
        }

        res.json = function expressOpenAPIJson(...args) {

          interface MyError {
            name: string;
            message: string;
            code: number;
          }

          function isErrorsResponse(json: FormattedSubmitResponse | Prepare | ErrorsResponse | object): json is ErrorsResponse {
            return (json as ErrorsResponse).errors !== undefined;
          }

          const json = args[0];

          if (json) {
            const serializedErrors: MyError[] = [];
            if (isErrorsResponse(json)) {
              json.errors.forEach(error => {
                if (error instanceof Error) {

                  // `RippledError`s contain `error` (e.g. `actNotFound` when source account is not found)
                  const name = ((error as any).data && (error as any).data.error) || error.name;

                  // `RippledError`s contain `error_code` (e.g. `19` for `actNotFound`)
                  let code = (error as any).code || ((error as any).data && (error as any).data.error_code) || ERRORS.CODES.UNSPECIFIED;

                  if (name === 'DisconnectedError') {
                    // name: DisconnectedError
                    // message: websocket was closed
                    code = ERRORS.CODES.WEBSOCKET;
                    if (!json.message) {
                      json.message = 'Lost connection to rippled. Please try again.';
                    }
                  }

                  if (name === 'actNotFound') {
                    const data = (error as any).data;
                    if (!json.message && data.account && data.ledger_current_index && data.request.command) {
                      json.message = `The account (${data.account}) could not be found as of ledger ${data.ledger_current_index} (command: ${data.request.command})`;
                    }
                  }

                  if (!json.message) {
                    json.message = `${name}: ${error.message}`;
                  }

                  const e: any = {
                    name,
                    message: error.message.replace(/"/g, "'"),
                    code
                  }

                  // Add `request` and `searched_all`, if present
                  if ((error as any).data) {
                    if ((error as any).data.request) {
                      e.request = (error as any).data.request;
                    }
                    if ((error as any).data.searched_all !== undefined) {
                      e.searched_all = (error as any).data.searched_all;
                    }
                    if ((error as any).hint !== undefined) {
                      e.hint = (error as any).hint;
                    }
                  }

                  serializedErrors.push(e);
                } else {
                  log('Warning: Got non-Error:', error);
                  serializedErrors.push(error);
                }
              });
              json.errors = serializedErrors;
            }
          }

          return expressOpenAPISendOrJson(resJson, args);
        }
      }
      next();
    }

    this.app.use(validateAllResponses as RequestHandler);

    initialize({
      app: this.app,
      apiDoc: './api-doc.yml',
      dependencies: {
        api: rippleApiService.api, // RippleAPI instance
        log: this.pathDebug
      },
      paths: path.resolve(__dirname, '../dist/api-v3/paths/'),
      pathsIgnore: new RegExp('\.(spec|test)$'),
      promiseMode: true // Required to use promises in operations
    });

    interface ServerError {
      status?: number;
      message?: string;
      errors?: ServerError[];
      // ...
    };

    // Error handler for business logic
    this.app.use((err: ServerError, req: Request, res: Response, next: NextFunction) => {
      this.serverDebug('Server error:', err);
      // Error: [TimeoutError()]
      // (node:40986) [DEP0079] DeprecationWarning: Custom inspection function on Objects via .inspect() is deprecated
      //
      // GET /v3/accounts/rHn1DJH1dqzdZ5PrkFpgQPn6Tbn8wKsrk9/transactions 500
      // [WebSocket Error] websocket: read EHOSTUNREACH
      // Disconnected from rippled. Code: 1006
      if (res.headersSent) {
        this.serverDebug('headers were previously sent, not responding with error');
        return next(err);
      }

      const status = err.status || 500;
      delete err.status;
      const message = err.message;
      if (!err.errors) {
        err = {errors: [err]};
      }
      if (message) {
        // Include message first to improve readability.
        err = Object.assign({message}, err);
      }
      res.status(status).json(err);
    });

    this.app.use((req, res, _next) => {
      res.status(404);
      if (req.path.startsWith('/v3') === false) {
        res.json({
          errors: [ERRORS.MISSING_V3]
        });
      } else {
        res.json({
          errors: [ERRORS.NOT_FOUND]
        });
      }
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
