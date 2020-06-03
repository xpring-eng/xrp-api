// Unit tests for:
//     GET /v3/preparations/payments

import sinon from 'sinon';
import request from 'supertest';
import { mockApp, rippleApi } from "../../../fixtures/mocks";
import { expect } from 'chai';

const path = '/v3/preparations/payments';

describe(path, () => {
  it('prepares a payment - normal happy path', (done) => {
    sinon.stub(rippleApi.connection, 'getReserveBase').resolves(20000000);
    sinon.stub(rippleApi, 'request').withArgs('account_info', sinon.match.any).resolves({
      account_data: {
        Balance: "20000000",
        Flags: 0
      }
    });
    sinon.stub(rippleApi, 'getLedgerVersion').resolves(7000000);
    sinon.stub(rippleApi, 'prepareTransaction').withArgs(sinon.match.any, {}).resolves({
      txJSON: JSON.stringify({
        "TransactionType": "Payment",
        "Account": "rNQao3Z1irwRjKWSs8heL4a8WKLPKfLrXs",
        "Destination": "rpgHWJdXkSvvzikdJCpuMzU7zWnuqsJRCZ",
        "Amount": "123000000",
        "Flags": 2147483648,
        "LastLedgerSequence": 7000003,
        "Fee": "12",
        "Sequence": 7
      }),
      instructions: {
        fee: "0.000012",
        sequence: 7
      }
    });

    // GIVEN a source, destination, and amount to send
    const query = {
      source: 'XVDDpvwxP3yZaZGU1Gik6HxJ4kkAEy6roNBwRFT3eRecYmH',
      destination: 'X7ZrF85JfL7AwEg7MTwHuWNJjCrPrhHL3bPGHU9UASVz4eX',
      value: '123',
      currency: 'XRP'
    };

    // WHEN preparing a payment
    request(mockApp)
      .get(path)
      .query(query)
      .expect(200)
      // THEN return a payment
      .expect({
        "TransactionType": "Payment",
        "Account": "rNQao3Z1irwRjKWSs8heL4a8WKLPKfLrXs",
        "Destination": "rpgHWJdXkSvvzikdJCpuMzU7zWnuqsJRCZ",
        "Amount": "123000000",
        "Flags": 2147483648,
        "LastLedgerSequence": 7000003,
        "Fee": "12",
        "Sequence": 7,
        "min_ledger": 7000000,
        "max_ledger": 7000003
      })
      .end(done);
  });

  it('prepares a payment with a custom maxLedgerVersionOffset', (done) => {
    // GIVEN mocked networking and a max ledger version offset
    sinon.stub(rippleApi.connection, 'getReserveBase').resolves(20000000);
    sinon.stub(rippleApi, 'request').withArgs('account_info', sinon.match.any).resolves({
      account_data: {
        Balance: "20000000",
        Flags: 0
      }
    });
    sinon.stub(rippleApi, 'getLedgerVersion').resolves(7000000);
    sinon.stub(rippleApi, 'prepareTransaction').withArgs(sinon.match.any, {maxLedgerVersionOffset: 500}).resolves({
      txJSON: JSON.stringify({
        "TransactionType": "Payment",
        "Account": "rNQao3Z1irwRjKWSs8heL4a8WKLPKfLrXs",
        "Destination": "rpgHWJdXkSvvzikdJCpuMzU7zWnuqsJRCZ",
        "Amount": "123000000",
        "Flags": 2147483648,
        "LastLedgerSequence": 7000500,
        "Fee": "12",
        "Sequence": 7
      }),
      instructions: {
        fee: "0.000012",
        sequence: 7
      }
    });
    const maxLedgerVersionOffset = 500;

    // WHEN preparing a payment
    request(mockApp)
      .get(path)
      .query({
        source: 'XVDDpvwxP3yZaZGU1Gik6HxJ4kkAEy6roNBwRFT3eRecYmH',
        destination: 'X7ZrF85JfL7AwEg7MTwHuWNJjCrPrhHL3bPGHU9UASVz4eX',
        value: '123',
        currency: 'XRP',
        maxLedgerVersionOffset
      })
      .expect(200)
      .expect(res => {
        // THEN return a payment with LastLedgerSequence 500 greater than min_ledger
        expect(res.body.min_ledger + maxLedgerVersionOffset).to.equal(res.body.LastLedgerSequence);
        expect(res.body.min_ledger + maxLedgerVersionOffset).to.equal(res.body.max_ledger);
      })
      .expect({
        "TransactionType": "Payment",
        "Account": "rNQao3Z1irwRjKWSs8heL4a8WKLPKfLrXs",
        "Destination": "rpgHWJdXkSvvzikdJCpuMzU7zWnuqsJRCZ",
        "Amount": "123000000",
        "Flags": 2147483648,
        "LastLedgerSequence": 7000500,
        "Fee": "12",
        "Sequence": 7,
        "min_ledger": 7000000,
        "max_ledger": 7000500
      })
      .end(done);
  });
});
