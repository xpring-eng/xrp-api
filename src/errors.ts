const UNAUTHORIZED = 401;
const ACCOUNT_NOT_CONFIGURED = 6000;

const ERRORS = {
  INVALID_BEARER_TOKEN: (function() {
    const e = new Error('Invalid bearer token');
    e.name = 'Unauthorized';
    (e as any).code = UNAUTHORIZED;
    (e as any).status = 401;
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

export { ERRORS };
