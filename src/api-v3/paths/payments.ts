// PUT /v3/payments
//   Sign and/or submit a payment transaction. Idempotent.

// POST /v3/payments
//   Create, sign, and/or submit a payment transaction. Not idempotent.

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../types";
import { getConfig } from "../../config";
import { Payment } from "ripple-lib/dist/npm/transaction/payment";
import { Instructions } from "ripple-lib/dist/npm/transaction/types";
import { ERRORS } from "../../errors";
const config = getConfig();

export default function(api: RippleAPI, log: Function): Operations {
  async function put(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    let signedTransaction = req.body.signedTransaction;
    if (signedTransaction === undefined) {
      // Do not parse X-address, if present. This endpoint takes transactions fully-formed.
      // It only signs and submits them. To prepare transactions (converting X-addresses, if necessary),
      // use GET /v3/preparations/payments.

      if (!api.isValidAddress(req.body.Account)) {
        throw new Error('Invalid `Account`');
      }

      if (!config.accounts || !config.accounts[req.body.Account]) {
        throw ERRORS.ACCOUNT_NOT_CONFIGURED;
      }

      const accountWithSecret = config.accounts[req.body.Account];

      // Require valid Bearer Token
      let reqHasValidBearerToken = false;
      if (!accountWithSecret || 'Bearer ' + accountWithSecret.apiKey != req.headers.authorization) {
        log(`[401] does not match apiKey, authorization: ${req.headers.authorization}`);
        throw ERRORS.INVALID_BEARER_TOKEN;
      } else {
        reqHasValidBearerToken = true;
      }

      if (reqHasValidBearerToken) { // In the future, apply velocity limits here
        const tx = Object.assign({}, req.body);
        delete tx.min_ledger;
        delete tx.max_ledger;
        signedTransaction = api.sign(JSON.stringify(tx), accountWithSecret.secret).signedTransaction;
      }
    }
    const result = await api.request('submit', {
      tx_blob: signedTransaction
    });
    res.status(200).json(result);
  }

  async function post(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    // TODO: parse X Address
    const address = req.body.payment.source_address;
    const accountWithSecret = config.accounts[address];
    let reqHasValidBearerToken = false;

    if (req.body.submit === true) {
      if (!config.accounts || !config.accounts[address]) {
        throw ERRORS.ACCOUNT_NOT_CONFIGURED;
      }

      // Require valid Bearer Token
      if (!accountWithSecret || 'Bearer ' + accountWithSecret.apiKey != req.headers.authorization) {
        log(`[401] does not match apiKey, authorization: ${req.headers.authorization}`);
        throw ERRORS.INVALID_BEARER_TOKEN;
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
    if (q.source_tag !== undefined) {
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
    if (q.destination_tag !== undefined) {
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
        delete result.resultCode;    // (use `engine_result` instead)
        delete result.resultMessage; // (use `engine_result_message` instead)
        res.status(200).json(result);
        return;
      }
      res.status(200).json(prepared);
      return;
    } catch (error) {
      log(`Unable to prepare/sign/submit: ${error}`);

      // [RippledError(Account not found., { account: 'rLRnD5g6eb3TWrvfHoZ8y2mRznuu7GJzeN',
      // error: 'actNotFound',
      // error_code: 19,
      // error_message: 'Account not found.',
      // id: 3,
      // ledger_current_index: 1377457,
      // request:
      //  { account: 'rLRnD5g6eb3TWrvfHoZ8y2mRznuu7GJzeN',
      //    command: 'account_info',
      //    id: 3 },
      // status: 'error',
      // type: 'response',
      // validated: false })]

      res.status(400).json({errors: [error]});
      return;
    }
  }

  const operations = {
    put,
    post
  };

  return operations as Operations;
}
