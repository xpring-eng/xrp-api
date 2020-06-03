import sinon from 'sinon';
import request from 'supertest';
import { mockApp, rippleApi } from "../../fixtures/mocks";

const path = '/v3/payments';

interface ErrorWithData extends Error {
  data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe(path, () => {
  it('returns `Account not found.` when the account does not exist', (done) => {
    const err = new Error('Account not found.') as ErrorWithData;
    err.name = 'RippledError';
    err.data = { account: 'rLRnD5g6eb3TWrvfHoZ8y2mRznuu7GJzeN',
      error: 'actNotFound',
      error_code: 19,
      error_message: 'Account not found.',
      id: 3,
      ledger_current_index: 1377457,
      request:
     { account: 'rLRnD5g6eb3TWrvfHoZ8y2mRznuu7GJzeN',
       command: 'account_info',
       id: 3 },
      status: 'error',
      type: 'response',
      validated: false };
    sinon.stub(rippleApi, 'preparePayment').throws(err);

    // GIVEN a source_account that does not exist
    const nonExistentAccount = 'rLRnD5g6eb3TWrvfHoZ8y2mRznuu7GJzeN';

    // WHEN creating a payment
    request(mockApp)
      .post(path)
      .send({
        payment: {
          source_address: nonExistentAccount,
          source_amount: {value: '100', currency: 'XRP'},
          destination_address: 'rLRnD5g6eb3TWrvfHoZ8y2mRznuu7GJzeN',
          destination_amount: {value: '100', currency: 'XRP'}
        },
        submit: false
      })
      // THEN return "Account not found." error (actNotFound)
      .expect(400, {"errors":[{"name":"actNotFound","message":"Account not found.","code":19,"request":{"account":"rLRnD5g6eb3TWrvfHoZ8y2mRznuu7GJzeN","command":"account_info","id":3}}],"message":"The account (rLRnD5g6eb3TWrvfHoZ8y2mRznuu7GJzeN) could not be found as of ledger 1377457 (command: account_info)"})
      .end(done);
  });
});
