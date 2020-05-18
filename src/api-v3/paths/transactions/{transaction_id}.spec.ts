// Unit tests:
//   GET /v3/transactions/{transaction_id}

import request from 'supertest';
import { mockApp, rippleApi } from '../../../fixtures/mocks';
import { expect } from 'chai';
import sinon from 'sinon';
import txFixture from '../../../fixtures/rippled/tx.json';

const path = '/v3/transactions/{transaction_id}';

describe(path, () => {
  beforeEach(() => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    sinon.stub(rippleApi, 'getLedgerVersion').returns(Promise.resolve(7145670));
  });
  afterEach(() => {
    sinon.restore();
  });

  it('finds a tx', (done) => {
    sinon.stub(rippleApi, 'request').resolves(txFixture);

    // GIVEN a transaction_id
    const transaction_id = '992D01C798E3DAC2A368D3550352A6198686D3205C491A6CA7442BBE158955E2';
    // WHEN retrieving a transaction
    request(mockApp)
      .get(path.replace('{transaction_id}', transaction_id))
      .expect(200)
      .expect(res => {
        // THEN the expected transaction object is received
        expect(res.text).to.equal(JSON.stringify(txFixture));
      })
      .end(done);
  });

  it('passes through min_ledger and max_ledger', (done) => {
    // GIVEN a transaction_id
    const transaction_id = '992D01C798E3DAC2A368D3550352A6198686D3205C491A6CA7442BBE158955E2';
    // AND min_ledger
    const min_ledger = 100;
    // AND max_ledger
    const max_ledger = 200;

    sinon.stub(rippleApi, 'request').withArgs('tx', {
      transaction: transaction_id,
      min_ledger,
      max_ledger
    }).resolves(txFixture);

    // WHEN retrieving a transaction
    request(mockApp)
      .get(path.replace('{transaction_id}', transaction_id) + `?min_ledger=${min_ledger}&max_ledger=${max_ledger}`)
      .expect(200)
      .expect(res => {
        // THEN the expected transaction object is received
        expect(res.text).to.equal(JSON.stringify(txFixture));
      })
      .end(done);
  });
});
