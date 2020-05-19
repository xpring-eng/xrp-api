// GET /v3/transactions/{transaction_id}

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse, AppliedTransaction } from "../../../types";
import { ERRORS } from "../../../errors";

export default function(api: RippleAPI, log: Function): Operations {

  async function get(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {

    if (req.headers.api_version === '2020-05-11') {
      return api.getTransaction(req.params.transaction_id).then((info: object) => {
        res.status(200).json(info);
      }).catch(error => {
        const status = error.name === 'NotFoundError' ? 404 : 400;
        const message = error.data && error.data.error_message ? error.data.error_message : error.message || error.name || 'Error';
        if (error.data && error.name) {
          error.data.name = error.name;
        }
        error = error.data || error;
        if (error.code === undefined) {
          error.code = ERRORS.CODES.GET_TRANSACTION;
        }
        const response = {
          message,
          errors: [error]
        };
        res.status(status).json(response);
      });
    } else {
      return api.request('tx', Object.assign({}, {
        transaction: req.params.transaction_id
      }, req.query)).then((info: AppliedTransaction) => {
        // If not fully validated, return 404 with `searched_all: false`
        if (info.validated !== true) { // In the future, we could add a way to access unvalidated ledger data
          // Do not throw, which would be caught in the `catch` below
          res.status(404).json({
            errors: [ERRORS.TXN_NOT_VALIDATED]
          });
        } else {
          res.status(200).json(info);
        }
      }).catch((error: object) => {
        res.status(404).json({
          errors: [error]
        });
      });
    }
  }

  const operations = {
    get
  };

  return operations as Operations;
}
