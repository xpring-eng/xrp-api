// GET /v1/accounts/{address}/transactions

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../../../types";
import { finishRes } from "../../../../finishRes";

export default function(api: RippleAPI, log: Function): Operations {
  async function GET(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    const options = Object.assign({},
      req.query
    );

    const hasOnlyDigits = (value: string) => {
      return /^\d+$/.test(value);
    }

    if (hasOnlyDigits(options.minLedgerVersion)) {
      options.minLedgerVersion = parseInt(options.minLedgerVersion);
    }

    if (!options.minLedgerVersion) {
      const info = await api.getServerInfo();
      const parts = info.completeLedgers.split('-');
      if (hasOnlyDigits(parts[0])) {
        options.minLedgerVersion = parseInt(parts[0]);
      }
    }

    try {
      api.getTransactions(req.params.address, options).then((transactions) => {
        const response = Object.assign({},
          {
            transactions,
            minLedgerVersion: options.minLedgerVersion,
            validated: true
          }
        );
        finishRes(res, 200, response);
      }).catch(error => {
        log('promise caught error', error);
        finishRes(res, 200, {errors: [error]}); // TODO: 400 for invalid?
      });
    } catch(err) {
      log('try caught error', err);
      // e.g. ValidationError: instance.options.minLedgerVersion is not exactly one from [subschema 0],[subschema 1]
      finishRes(res, 200, {errors: [err]}); // TODO: 400 for invalid?
    }
  }

  const operations = {
    GET
  };

  return operations as Operations;
}
