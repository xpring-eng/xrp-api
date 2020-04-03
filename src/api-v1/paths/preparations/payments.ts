// GET /v3/preparations/payments

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../../types";
import { finishRes } from "../../../finishRes";
import { ERRORS } from "../../../errors";

export default function(api: RippleAPI, log: Function): Operations {
  async function get(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    const options = Object.assign({},
      req.query
    );

    const Amount = (() => {
      if (options.currency === 'XRP') return api.xrpToDrops(options.value);
      if (options.currency === 'drops') return options.value;
      if (options.currency === undefined) return undefined;
      const status = 400;
      const message = 'Unsupported currency';
      const error: any = {
        code: ERRORS.CODES.UNSUPPORTED_CURRENCY,
        message: 'If provided, `currency` must be `XRP` or `drops`',
      };
      const response = {
        message,
        errors: [error]
      };
      finishRes(res, status, response);
    })();

    const removeUndefined = (obj: any) => {
      Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
      return obj;
    };
    const transaction = removeUndefined({
      TransactionType: "Payment",
      Account: options.source,
      Destination: options.destination,
      Amount
    });

    try {
      const prepared = await api.prepareTransaction(transaction);
      const response = JSON.parse(prepared.txJSON);
      finishRes(res, 200, response);

    } catch(error) {
      // e.g. ValidationError(instance.Account is not exactly one from <xAddress>,<classicAddress>)

      const status = 400;
      const message = error.data && error.data.error_message ? error.data.error_message : error.name || 'Error';
      if (error.data && error.name) {
        error.data.name = error.name; // e.g. "RippledError"
      }
      error = error.data || error;
      if (error.code === undefined) {
        error.code = ERRORS.CODES.GET_PREPARATIONS_PAYMENTS;
      }

      // Make the error easier to understand
      error.message = error.message?.replace('instance.', '');

      const response = {
        message,
        errors: [error],
        Transaction: transaction
      };
      finishRes(res, status, response); // Validates
    }
  }

  const operations = {
    get
  };

  return operations as Operations;
}
