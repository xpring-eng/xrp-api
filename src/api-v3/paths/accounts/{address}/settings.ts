// GET /v3/accounts/{address}/settings
// POST /v3/accounts/{address}/settings

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../../../types";
import { getConfig } from "../../../../config";
import { ERRORS } from "../../../../errors";
const config = getConfig();

export default function(api: RippleAPI, log: Function): Operations {

  async function get(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    const parameters = Object.assign({},
      {'ledger_index': 'current'}, // default to 'current' (in-progress) ledger
      req.query,
      {account: req.params.address}
    );

    // TODO: make sure response includes 'validated: true | false'

    api.getSettings(parameters.account, {
      ledgerVersion: parameters.ledger_index
    }).then((settings) => {
      res.status(200).json(settings);
    }).catch(error => {
      const status = error.message === 'Account not found.' ? 404 : 400;
      const message = error.data && error.data.error_message ? error.data.error_message : error.name || 'Error';
      if (error.data && error.name) {
        error.data.name = error.name; // e.g. "RippledError"
      }
      error = error.data || error;
      if (error.code === undefined) {
        error.code = ERRORS.CODES.GET_SETTINGS;
      }
      const response = {
        message,
        errors: [error]
      };
      res.status(status).json(response);
    });
  }

  async function post(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    const address = req.params.address; // TODO: parse X Address
    const settings = req.body.settings; // TODO: validate
    // const instructions = ...; // TODO: add this in the future, if use cases require it (for multisigning?)

    // TODO: make sure response includes 'validated: true | false'

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

    try {
      const prepared = await api.prepareSettings(address, settings); // instructions
      if (req.body.submit === true && reqHasValidBearerToken) {
        const signed = api.sign(prepared.txJSON, accountWithSecret.secret);
        const result = await api.submit(signed.signedTransaction);
        delete result.resultCode; // use `engine_result` instead
        delete result.resultMessage; // use `engine_result_message` instead
        res.status(200).json(result);
        return;
      }
      res.status(200).json(prepared);
      return;
    } catch (error) {
      log(`Unable to prepare/sign/submit: ${error}`);
      res.status(400).json(error);
      return;
    }
  }

  const operations = {
    get, post
  };

  return operations as Operations;
}
