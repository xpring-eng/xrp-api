const UNAUTHORIZED = 8010;
const ACCOUNT_NOT_CONFIGURED = 6000;

const ERRORS = {
  INVALID_BEARER_TOKEN: (function() {
    const e = new Error('Invalid bearer token');
    e.name = 'Unauthorized';
    (e as any).code = UNAUTHORIZED;
    return e;
  })(),
  ACCOUNT_NOT_CONFIGURED: (function() {
    const e = new Error('Check server configuration');
    e.name = 'Account not configured';
    (e as any).code = ACCOUNT_NOT_CONFIGURED;
    return e;
  })(),
  CODES: {
    NOT_FOUND: 404,
    GET_SETTINGS: 1000,
    GET_TRANSACTIONS: 1010,
    GET_TRANSACTION: 1020,
    GET_PREPARATIONS_PAYMENTS: 1030,
    UNSUPPORTED_CURRENCY: 2000,
    ACCOUNT_NOT_CONFIGURED,
    WEBSOCKET: 7000, // DisconnectedError: websocket was closed
    MISSING_V1: 8000,
    MISSING_V3: 8000,
    UNAUTHORIZED,
    UNSPECIFIED: 9000
  }
};

export { ERRORS };
