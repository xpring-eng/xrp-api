// GET /v1/accounts/{address}/info

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../../../types";

export default function(api: RippleAPI, log: Function): Operations {

  // Simply logs result of validation to debug output
  const validate = (res: ValidatableResponse, statusCode: number, response: object): void => {
    // TODO: validate all responses
    if (process.env.NODE_ENV != 'production') {
      const validation = res.validateResponse(statusCode, response);
      if (validation) {
        // red
        log('\x1b[31m%s\x1b[0m', '/accounts/{address}/info: validation:', validation);
      } else {
        // green
        log('\x1b[32m%s\x1b[0m', '/accounts/{address}/info: response validated');
      }
    }
  };

  async function get(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    const parameters = Object.assign({},
      {'ledger_index': 'current'}, // default to 'current' (in-progress) ledger
      req.query,
      {account: req.params.address}
    );
    api.request('account_info', parameters).then((info: object) => {
      validate(res, 200, info);
      res.status(200).json(info);
    }).catch(error => {
      const status = error.data.error === 'actNotFound' ? 404 : 400;
      const message = error.data && error.data.error_message ? error.data.error_message : 'Error';
      error.data.name = error.name; // e.g. "RippledError"
      if (error.data.error_message) {
        error.data.message = error.data.error_message;
        delete error.data.error_message;
      }
      if (error.data.error_code) {
        error.data.code = error.data.error_code;
        delete error.data.error_code;
      }
      const response = {
        message,
        errors: [error.data]
      };
      validate(res, status, response);
      res.status(status).json(response);
    });
  }

  const operations = {
    get
  };

  return operations as Operations;
}
