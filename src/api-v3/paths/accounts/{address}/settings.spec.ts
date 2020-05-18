import request from 'supertest';
import { mockApp, rippleApi } from "../../../../fixtures/mocks";
import sinon from 'sinon';
// import getAccountInfoFixture from '../../../../fixtures/getAccountInfo.json';
const path = '/v3/accounts/{address}/settings';

describe.skip(path, () => {
  it('GET - returns account settings', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    // sinon.stub(rippleApi, 'request').resolves(getAccountInfoFixture);

    request(mockApp)
      .get(path)
      .expect(200)
      // .expect(res => {
      //   expect(res.text.length).to.be.greaterThan(400).lessThan(500);

      //   expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","/accounts/{address}/info: response validated"]);
      // })
      .end(done);
  });

  it('GET - passes along ledger_index', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    // sinon.stub(rippleApi, 'request').withArgs('account_info', {
    //   ledger_index: 'validated', // eslint-disable-line @typescript-eslint/camelcase
    //   account: '{address}'
    // }).resolves(Object.assign({}, getAccountInfoFixture, {validated: true}));

    request(mockApp)
      .get(path + '?ledger_index=validated')
      .expect(200)
      // .expect(res => {
      //   expect(res.text.length).to.be.greaterThan(400).lessThan(500);
      //   expect(res.body.validated).to.equal(true);

      //   expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","/accounts/{address}/info: response validated"]);
      // })
      .end(done);
  });

  // it('GET - fails validation when response is invalid', (done) => {
  //   sinon.stub(rippleApi, 'isConnected').returns(true);
  //   const getAccountInfoResponse = Object.assign({}, getAccountInfoFixture);
  //   // For testing only:
  //   (getAccountInfoResponse.account_data as any).foo = 'bar'; // eslint-disable-line @typescript-eslint/no-explicit-any
  //   sinon.stub(rippleApi, 'request').resolves(getAccountInfoResponse);

  //   request(mockApp)
  //     .get(path)
  //     .expect(200)
  //     .expect(() => {
  //       expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[31m%s\u001b[0m","/accounts/{address}/info: validation:",{"message":"The response was not valid.","errors":[{"path":"account_data","errorCode":"additionalProperties.openapi.responseValidation","message":"account_data should NOT have additional properties"}]}]);
  //     })
  //     .end(done);
  // });

  afterEach(() => {
    sinon.restore();
  });
});
