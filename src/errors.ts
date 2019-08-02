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

export { ERRORS };
