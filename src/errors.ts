/**
 * XRP-API Errors
 */

interface XrpApiError extends Error {
  code?: number;
  status?: number;
  data?: {
    error?: string;
    error_code?: number;
    account?: string;
    ledger_current_index?: number;
    request?: {
      command: string;
    };
    searched_all?: boolean;
  };
  hint?: string;
  request?: {
    command: string;
  };
  searched_all?: boolean;
}

const UNAUTHORIZED = 401;
const TXN_NOT_VALIDATED = 1404;
const ACCOUNT_NOT_CONFIGURED = 6000;

const ERRORS = {
  INVALID_BEARER_TOKEN: (function() {
    const e: XrpApiError = new Error('Invalid bearer token');
    e.name = 'Unauthorized';
    e.code = UNAUTHORIZED;
    e.status = 401;
    return e;
  })(),
  TXN_NOT_VALIDATED: (function() {
    const e: XrpApiError = new Error('Transaction not found');
    e.name = 'txnNotFound';
    e.code = TXN_NOT_VALIDATED;
    e.status = 404;
    e.data = {searched_all: false};
    e.hint = 'The transaction has not been fully validated. Try again later';
    return e;
  })(),
  ACCOUNT_NOT_CONFIGURED: (function() {
    const e: XrpApiError = new Error('Check server configuration');
    e.name = 'Account not configured';
    e.code = ACCOUNT_NOT_CONFIGURED;
    e.status = 400;
    return e;
  })(),
  MISSING_V3: (function() {
    const e: XrpApiError = new Error('Missing version prefix in path');
    e.name = 'Not found';
    e.code = 404;
    e.status = 404;
    e.hint = 'Try starting the path with `/v3`';
    return e;
  })(),
  NOT_FOUND: (function() {
    const e: XrpApiError = new Error('Path not found');
    e.name = 'Not found';
    e.code = 404;
    e.status = 404;
    e.hint = 'Ensure that all path parameters are supplied';
    return e;
  })(),
  CODES: {
    // txnNotFound: 29,
    NOT_FOUND: 404,
    GET_SETTINGS: 1000,
    GET_TRANSACTIONS: 1010,
    GET_TRANSACTION: 1020,
    GET_PREPARATIONS_PAYMENTS: 1030,
    TXN_NOT_VALIDATED,
    DESTINATION_TAG_NEEDED: 143, // Matches tecDST_TAG_NEEDED https://xrpl.org/tec-codes.html
    NO_DESTINATION_INSUFFICIENT_XRP: 125, // Matches tecNO_DST_INSUF_XRP https://xrpl.org/tec-codes.html
    UNSUPPORTED_CURRENCY: 2000,
    ACCOUNT_NOT_CONFIGURED,
    WEBSOCKET: 7000, // DisconnectedError: websocket was closed
    MISSING_V3: 8000,
    UNAUTHORIZED,
    UNSPECIFIED: 9000
  }
};

export { ERRORS, XrpApiError };
