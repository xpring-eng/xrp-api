import { ValidatableResponse } from "./types";
import { FormattedSubmitResponse } from "ripple-lib/dist/npm/transaction/submit";
import { Prepare } from "ripple-lib/dist/npm/transaction/types";
import { debuglog } from "util";
import { ERRORS } from "./errors";

const log = debuglog('paths');

interface ErrorsResponse {
  message: string;
  errors: Error[];
}

// Simply logs result of validation to debug output
const validate = (res: ValidatableResponse, statusCode: number, response: object): void => {
  if (process.env.NODE_ENV != 'production') {
    if (typeof res.validateResponse !== 'function') {
      console.error('TypeError: res.validateResponse is not a function. Check `api-doc.yml`.');
      return;
    }
    const validation = res.validateResponse(statusCode, response);
    if (validation) {
      // red
      log('\x1b[31m%s\x1b[0m', res.req ? res.req.path : '', 'validation:', validation);
    } else {
      // green
      log('\x1b[32m%s\x1b[0m', res.req ? res.req.path : '', 'response validated');
    }
  }
};

// Wrapper around `res` that reformats errors to make them more informative
export function finishRes(res: ValidatableResponse, status: number, json: FormattedSubmitResponse | Prepare | ErrorsResponse | object): void {
  interface MyError {
    name: string;
    message: string;
    code: number;
  }
  function isErrorsResponse(json: FormattedSubmitResponse | Prepare | ErrorsResponse | object): json is ErrorsResponse {
    return (json as ErrorsResponse).errors !== undefined;
  }
  const serializedErrors: MyError[] = [];
  if (isErrorsResponse(json)) {
    json.errors.forEach(error => {
      if (error instanceof Error) {

        // `RippledError`s contain `error` (e.g. `actNotFound` when source account is not found)
        const name = ((error as any).data && (error as any).data.error) || error.name;

        // `RippledError`s contain `error_code` (e.g. `19` for `actNotFound`)
        let code = (error as any).code || ((error as any).data && (error as any).data.error_code) || ERRORS.CODES.UNSPECIFIED;

        if (name === 'DisconnectedError') {
          // name: DisconnectedError
          // message: websocket was closed
          code = ERRORS.CODES.WEBSOCKET;
          if (!json.message) {
            json.message = 'Lost connection to rippled. Please try again.';
          }
        }

        if (name === 'actNotFound') {
          const data = (error as any).data;
          if (!json.message && data.account && data.ledger_current_index && data.request.command) {
            json.message = `The account (${data.account}) could not be found as of ledger ${data.ledger_current_index} (command: ${data.request.command})`;
          }
        }

        if (!json.message) {
          json.message = `${name}: ${error.message}`;
        }

        const e: any = {
          name,
          message: error.message.replace(/"/g, "'"),
          code
        }

        // Add `request` and `searched_all`, if present
        if ((error as any).data) {
          if ((error as any).data.request) {
            e.request = (error as any).data.request;
          }
          if ((error as any).data.searched_all !== undefined) {
            e.searched_all = (error as any).data.searched_all;
          }
          if ((error as any).hint !== undefined) {
            e.hint = (error as any).hint;
          }
        }

        serializedErrors.push(e);
      } else {
        log('Warning: Got non-Error:', error);
        serializedErrors.push(error);
      }
    });
    json.errors = serializedErrors;
  }

  validate(res, status, json);
  res.status(status).json(json); // INVALID_BEARER_TOKEN -> Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
}
