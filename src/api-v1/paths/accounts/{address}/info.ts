// GET /v1/accounts/{address}/info

import { RippleAPI } from "ripple-lib";
import { Request, Response, NextFunction } from "express";
import { Operation } from "express-openapi";

export default function(api: RippleAPI, log: Function) {
  const operations: {
    GET: Operation
  } = {
    GET
  };

  const validate = (res: any, response: object) => {
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
  }

  async function GET(req: Request, res: Response, next: NextFunction) {
    const parameters = Object.assign({},
      {ledger_index: 'current'}, // default to 'current' (in-progress) ledger
      req.query,
      {account: req.params.address}
    )
    debugger;
    api.request('account_info', parameters).then((info: object) => {
      validate(res, info);
      res.status(200).json(info);
    }).catch(error => {
      validate(res, {error});
      res.status(200).json({error});
    });
  }

  return operations;
}
