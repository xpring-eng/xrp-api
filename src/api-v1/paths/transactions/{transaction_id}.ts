// GET /v1/transactions/{transaction_id}

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../../types";

export default function(api: RippleAPI, log: Function): Operations {

  // Simply logs result of validation to debug output
  const validate = (res: ValidatableResponse, response: object): void => {
    // TODO: validate all responses
    if (process.env.NODE_ENV != 'production') {
      const validation = res.validateResponse(200, response);
      if (validation) {
        // red
        log('\x1b[31m%s\x1b[0m', '/accounts/{address}/info: validation:', validation);
      } else {
        // green
        log('\x1b[32m%s\x1b[0m', '/accounts/{address}/info: response validated');
      }
    }
  };

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
        res.status(200).json({error});
    });
  }

  const operations = {
    GET
  };

  return operations as Operations;
}
