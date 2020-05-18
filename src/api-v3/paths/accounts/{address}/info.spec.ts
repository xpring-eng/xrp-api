import request from 'supertest';
import { mockApp, rippleApi, mockedDebuglog } from "../../../../fixtures/mocks";
import { expect } from 'chai';
import sinon from 'sinon';
import { capture } from 'ts-mockito';
import getAccountInfoFixture from '../../../../fixtures/getAccountInfo.json';
import accountInfoLedgerIndexFooFixture from '../../../../fixtures/rippled/account_info-ledger_index-foo.json';
import accountInfoLedgerIndexFooResponseFixture from '../../../../fixtures/account_info-ledger_index-foo-response.json';

const path = '/v3/accounts/{address}/info';

describe(path, () => {
  afterEach(() => {
    sinon.restore();
  });

  it('GET - returns account info', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    sinon.stub(rippleApi, 'request').resolves(getAccountInfoFixture);

    request(mockApp)
      .get(path)
      .expect(200)
      .expect(res => {
        expect(res.text.length).to.be.greaterThan(400).lessThan(500);

        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","/v3/accounts/{address}/info response validated"]);
      })
      .end(done);
  });

  it('GET - passes along ledger_index', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    sinon.stub(rippleApi, 'request').withArgs('account_info', {
      // Use camelcase for rippled API
      ledger_index: 'validated', // eslint-disable-line @typescript-eslint/camelcase
      account: '{address}'
    }).resolves(Object.assign({}, getAccountInfoFixture, {validated: true}));

    request(mockApp)
      .get(path + '?ledger_index=validated')
      .expect(200)
      .expect(res => {
        expect(res.text.length).to.be.greaterThan(400).lessThan(500);
        expect(res.body.validated).to.equal(true);

        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","/v3/accounts/{address}/info response validated"]);
      })
      .end(done);
  });

  it('GET - with invalid ledger_index - returns 400 bad request', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    sinon.stub(rippleApi, 'request')
      .rejects({name: 'RippledError', data: accountInfoLedgerIndexFooFixture});

    request(mockApp)
      .get(path + '?ledger_index=foo')
      .expect(400)
      .expect(res => {
        expect(JSON.parse(res.text)).to.eql(accountInfoLedgerIndexFooResponseFixture);
      })
      .end(done);
  });

  it('GET - fails validation when response is invalid', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const getAccountInfoResponse = Object.assign({}, getAccountInfoFixture);
    // For testing only:
    (getAccountInfoResponse.account_data as any).foo = 'bar'; // eslint-disable-line @typescript-eslint/no-explicit-any
    sinon.stub(rippleApi, 'request').resolves(getAccountInfoResponse);

    request(mockApp)
      .get(path)
      .expect(200)
      .expect(() => {
        expect(capture(mockedDebuglog.log).byCallIndex(0)).to.deep.equal(["\u001b[31m%s\u001b[0m","/v3/accounts/{address}/info validation:",{"message":"The response was not valid.","errors":[{"path":"account_data","errorCode":"additionalProperties.openapi.responseValidation","message":"account_data should NOT have additional properties"}]}]);
      })
      .end(done);
  });

  afterEach(() => {
    sinon.restore();
  });
});
