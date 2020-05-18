// GET /v3/accounts/{address}/transactions

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../../../types";
import { finishRes } from "../../../../finishRes";
import { ERRORS } from "../../../../errors";

export default function(api: RippleAPI, log: Function): Operations {
  async function get(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    const options = Object.assign({},
      req.query
    );

    const hasOnlyDigits = (value: string) => {
      return /^\d+$/.test(value);
    };

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
      const transactions = await api.getTransactions(req.params.address, options);
      const response = Object.assign({},
        {
          transactions,
          minLedgerVersion: options.minLedgerVersion,
          validated: true
        }
      );
      finishRes(res, 200, response);
    } catch(error) {
      // e.g. ValidationError: instance.options.minLedgerVersion is not exactly one from [subschema 0],[subschema 1]

      const status = error.message === 'Account not found.' ? 404 : 400;
      const message = error.data && error.data.error_message ? error.data.error_message : error.name || 'Error';
      if (error.data && error.name) {
        error.data.name = error.name; // e.g. "RippledError"
      }
      error = error.data || error;
      if (error.code === undefined) {
        error.code = ERRORS.CODES.GET_TRANSACTIONS;
      }
      const response = {
        message,
        errors: [error]
      };
      finishRes(res, status, response); // Validates
    }
  }

  const operations = {
    get
  };

  return operations as Operations;
}
