// POST /v1/payments

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../types";
import config from '../../../.secret_config';
import { Payment } from "ripple-lib/dist/npm/transaction/payment";
import { Instructions, Prepare } from "ripple-lib/dist/npm/transaction/types";
import { FormattedSubmitResponse } from "ripple-lib/dist/npm/transaction/submit";

const ERRORS = {
  INVALID_BEARER_TOKEN: (function() {
    const e = new Error('Invalid bearer token');
    e.name = 'Unauthorized';
    return e;
  })(),
  ACCOUNT_NOT_CONFIGURED: (function() {
    const e = new Error('Check server configuration');
    e.name = 'Account not configured';
    return e;
  })()
};

export default function(api: RippleAPI, log: Function): Operations {

  // Simply logs result of validation to debug output
  const validate = (res: ValidatableResponse, response: object): void => {
    if (process.env.NODE_ENV != 'production') {
      const validation = res.validateResponse(200, response);
      if (validation) {
        // red
        log('\x1b[31m%s\x1b[0m', '/accounts/{address}/payments: validation:', validation);
      } else {
        // green
        log('\x1b[32m%s\x1b[0m', '/accounts/{address}/payments: response validated');
      }
    }
  };

  interface ErrorsResponse {
    errors: Error[];
  }
  function isErrorsResponse(json: FormattedSubmitResponse | Prepare | ErrorsResponse): json is ErrorsResponse {
    return (json as ErrorsResponse).errors !== undefined;
  }

  function finishRes(res: ValidatableResponse, status: number, json: FormattedSubmitResponse | Prepare | ErrorsResponse): void {
    interface MyError {
      name: string;
      message: string;
    }
    const serializedErrors: MyError[] = [];
    if (isErrorsResponse(json)) {
      json.errors.forEach(error => {
        if (error instanceof Error) {
          serializedErrors.push({
            name: error.name,
            message: error.message.replace(/"/g, "'")
          });
        } else {
          log('Warning: Got non-Error:', error);
          serializedErrors.push(error);
        }
      });
      json.errors = serializedErrors;
    }
    validate(res, json);
    res.status(status).json(json); // INVALID_BEARER_TOKEN -> Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
  }

  async function POST(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    // TODO: parse X Address
    const address = req.body.payment.source_address;
    const accountWithSecret = config.accounts[address];
    let reqHasValidBearerToken = false;

    if (req.body.submit === true) {
      if (!config.accounts || !config.accounts[address]) {
        finishRes(res, 400, {errors: [ERRORS.ACCOUNT_NOT_CONFIGURED]});
        return;
      }

      // Require valid Bearer Token
      if (!accountWithSecret || 'Bearer ' + accountWithSecret.apiKey != req.headers.authorization) {
        log(`[401] does not match apiKey, authorization: ${req.headers.authorization}`);
        finishRes(res, 401, {errors: [ERRORS.INVALID_BEARER_TOKEN]});
        return;
      } else {
        reqHasValidBearerToken = true;
      }
    }

    const q = req.body.payment;
    const payment: Payment | any = { // eslint-disable-line @typescript-eslint/no-explicit-any
      source: {
        address
      },
      destination: {
        address: q.destination_address
      }
    };
    if (q.source_amount) {
      payment.source.amount = q.source_amount;
    }
    if (q.source_tag) {
      payment.source.tag = q.source_tag;
    }
    if (q.source_max_amount) {
      payment.source.maxAmount = q.source_max_amount;
    }
    if (q.destination_amount) {
      if (payment.source.amount) {
        payment.destination.minAmount = q.destination_amount;
      } else {
        payment.destination.amount = q.destination_amount;
      }
    }
    if (q.destination_tag) {
      payment.destination.tag = q.destination_tag;
    }
    if (q.destinationMinAmount) {
      payment.destination.minAmount = q.destinationMinAmount;
    }
    if (q.allowPartialPayment === true) {
      payment.allowPartialPayment = true;
    }
    if (q.invoice_id) {
      payment.invoiceID = q.invoice_id;
    }
    if (q.limitQuality) {
      payment.limitQuality = q.limitQuality;
    }
    if (q.memos) {
      payment.memos = q.memos;
    }
    if (q.no_direct_ripple) {
      payment.noDirectRipple = q.no_direct_ripple;
    }
    if (q.paths) {
      payment.paths = q.paths;
    }
    const instructions: Instructions | any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (q.fee) {
      instructions.fee = q.fee;
    }
    if (q.maxFee) {
      instructions.maxFee = q.maxFee;
    }
    if (q.maxLedgerVersion) {
      instructions.maxLedgerVersion = q.maxLedgerVersion;
    }
    if (q.maxLedgerVersionOffset) {
      instructions.maxLedgerVersionOffset = q.maxLedgerVersionOffset;
    }
    if (q.sequence) {
      instructions.sequence = q.sequence;
    }
    if (q.signersCount) {
      instructions.signersCount = q.signersCount;
    }
    try {
      const prepared = await api.preparePayment(address, payment, instructions);
      if (req.body.submit === true && reqHasValidBearerToken) {
        const signed = api.sign(prepared.txJSON, accountWithSecret.secret);
        const result = await api.submit(signed.signedTransaction);
        delete result.resultCode; // use `engine_result` instead
        delete result.resultMessage; // use `engine_result_message` instead
        finishRes(res, 200, result);
        return;
      }
      finishRes(res, 200, prepared);
      return;
    } catch (error) {
      log(`Unable to prepare/sign/submit: ${error}`);
      finishRes(res, 400, {errors: [error]});
      return;
    }
  }

  const operations = {
    POST
  };

  return operations as Operations;
}
