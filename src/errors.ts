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
  })(),
  CODES: {
    NOT_FOUND: 404,
    GET_SETTINGS: 1000,
    GET_TRANSACTIONS: 1010,
    GET_TRANSACTION: 1020,
    MISSING_V1: 8000,
    UNSPECIFIED: 9000
  }
};

export { ERRORS };
