// Unit tests:
//   GET /v3/transactions/{transaction_id}

import request from 'supertest';
import { mockApp, rippleApi, mockedDebuglog } from '../../../fixtures/mocks';
import { expect } from 'chai';
import sinon from 'sinon';
import txFixture from '../../../fixtures/rippled/tx.json';

const path = '/v3/transactions/{transaction_id}'

describe(path, () => {
  before(() => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    sinon.stub(rippleApi, 'getLedgerVersion').returns(Promise.resolve(7145670));
    sinon.stub(rippleApi, 'request').resolves(txFixture);
  })
  after(() => {
    sinon.restore();
  })

  it('finds a tx', (done) => {
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
})
