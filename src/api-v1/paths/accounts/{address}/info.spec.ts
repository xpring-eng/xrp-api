import request from 'supertest';
import { mockApp, rippleApi, mockedDebuglog } from "../../../../../test/mocks";
import { expect } from 'chai';
import sinon from 'sinon';
import { capture } from 'ts-mockito';

const fixture_getAccountInfo = require('../../../../../test/fixtures/getAccountInfo');
const path = '/v1/accounts/{address}/info';

describe(path, () => {
  it('GET - returns account info', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    sinon.stub(rippleApi, 'request').resolves(fixture_getAccountInfo);
    
    request(mockApp)
      .get(path)
      .expect(200)
      .expect(res => {
        expect(res.text.length).to.be.greaterThan(400).lessThan(500);
        
        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","/accounts/{address}/info: response validated"]);
      })
      .end(done);
  });

  it('GET - passes along ledger_index', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    sinon.stub(rippleApi, 'request').withArgs('account_info', {
      ledger_index: 'validated',
      account: '{address}'
    }).resolves(Object.assign({}, fixture_getAccountInfo, {validated: true}));
    
    request(mockApp)
      .get(path + '?ledger_index=validated')
      .expect(200)
      .expect(res => {
        expect(res.text.length).to.be.greaterThan(400).lessThan(500);
        expect(res.body.validated).to.equal(true);
        
        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","/accounts/{address}/info: response validated"]);
      })
      .end(done);
  });

  it('GET - fails validation when response is invalid', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const getAccountInfoResponse = Object.assign({}, fixture_getAccountInfo);
    getAccountInfoResponse.account_data.foo = 'bar';
    sinon.stub(rippleApi, 'request').resolves(getAccountInfoResponse);

    request(mockApp)
      .get(path)
      .expect(200)
      .expect(() => {
        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[31m%s\u001b[0m","/accounts/{address}/info: validation:",{"message":"The response was not valid.","errors":[{"path":"account_data","errorCode":"additionalProperties.openapi.responseValidation","message":"account_data should NOT have additional properties"}]}]);
      })
      .end(done);
  });

  afterEach(() => {
    sinon.restore();
  });
});
