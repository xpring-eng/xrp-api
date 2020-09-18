// GET /v3/accounts/{address}/info

import { NextFunction, Request } from "express";
import { RippleAPI } from "ripple-lib";
import { Operations, ValidatableResponse } from "../../../../types";

export default function(api: RippleAPI, log: Function): Operations {

  /**
   * @swagger
   * /v3/accounts/{address}/info:
   *   get:
   *     description: Gets account information for an address
   *     parameters:
   *       - name: address
   *         description: XRP address
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     produces:
   *      - application/json
   *     responses:
   *       '200':
   *          description: OK
   */
  async function get(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    const parameters = Object.assign({},
      {'ledger_index': 'current'}, // default to 'current' (in-progress) ledger
      req.query,
      {account: req.params.address}
    );
    // If ledger_index is numeric
    if (!isNaN(parameters.ledger_index)) {
      // Convert to number (returns NaN if the string is not purely numeric)
      parameters.ledger_index = +parameters.ledger_index;
    }
    return api.request('account_info', parameters).then((info: object) => {
      res.status(200).json(info);
    }).catch(error => {
      const status = error.data.error === 'actNotFound' ? 404 : 400;
      const message = error.data && error.data.error_message ? error.data.error_message : 'Error';
      error.data.name = error.name; // e.g. "RippledError"
      if (error.data.error_message) {
        error.data.message = error.data.error_message;
        delete error.data.error_message;
      }
      if (error.data.error_code) {
        error.data.code = error.data.error_code;
        delete error.data.error_code;
      }
      const response = {
        message,
        errors: [error.data]
      };
      res.status(status).json(response);
    });
  }

  const operations = {
    get
  };

  return operations as Operations;
}
