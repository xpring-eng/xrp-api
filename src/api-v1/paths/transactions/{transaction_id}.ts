// GET /v1/transactions/{transaction_id}

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../../types";
import { ERRORS } from "../../../errors";
import { finishRes } from "../../../finishRes";

export default function(api: RippleAPI, log: Function): Operations {

  // Simply logs result of validation to debug output
  // const validate = (res: ValidatableResponse, response: object): void => {
  //   // TODO: validate all responses
  //   if (process.env.NODE_ENV != 'production') {
  //     const validation = res.validateResponse(200, response);
  //     if (validation) {
  //       // red
  //       log('\x1b[31m%s\x1b[0m', '/accounts/{address}/info: validation:', validation);
  //     } else {
  //       // green
  //       log('\x1b[32m%s\x1b[0m', '/accounts/{address}/info: response validated');
  //     }
  //   }
  // };

  async function GET(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    // const parameters = Object.assign({},
    //   {'ledger_index': 'current'}, // default to 'current' (in-progress) ledger
    //   req.query,
    //   {account: req.params.address}
    // );
    // api.request('account_info', parameters).then((info: object) => {
    //   validate(res, info);
    //   res.status(200).json(info);
    // }).catch(error => {
    //   validate(res, {error});
    //   res.status(200).json({error});
    // });
    // TODO: validate transaction_id
    // TODO: options
    api.getTransaction(req.params.transaction_id).then((info: object) => {
      // TODO: validate()
      res.status(200).json(info);
    }).catch(error => {
      const status = error.name === 'NotFoundError' ? 404 : 400;
      const message = error.data && error.data.error_message ? error.data.error_message : error.message || error.name || 'Error';
      if (error.data && error.name) {
        error.data.name = error.name
      }
      error = error.data || error
      if (error.code === undefined) {
        error.code = ERRORS.CODES.GET_TRANSACTION;
      }
      const response = {
        message,
        errors: [error]
      }
      finishRes(res, status, response); // Validates
    });
  }

  const operations = {
    GET
  };

  return operations as Operations;
}
