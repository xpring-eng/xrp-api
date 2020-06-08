import request from 'supertest';
import { mockApp, rippleApi, mockedDebuglog } from "../../../../fixtures/mocks";
import sinon from 'sinon';
import { expect } from 'chai';
import { capture } from 'ts-mockito';

const path = '/v3/accounts/{address}/settings';

describe(path, () => {
  it.skip('GET - returns account settings', (done) => {
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

  it.skip('GET - passes along ledger_index', (done) => {
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

  it.skip('GET settings - request fails validation when request is invalid', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const invalidGetSettingsResponse = {
      foo: 'bar'
    }
    sinon.stub(rippleApi, 'request').resolves(invalidGetSettingsResponse);

    request(mockApp)
      .get(path)
      // .expect(200)
      .expect((x) => {
        console.log(x);
        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[31m%s\u001b[0m","/accounts/{address}/info: validation:",{"message":"The response was not valid.","errors":[{"path":"account_data","errorCode":"additionalProperties.openapi.responseValidation","message":"account_data should NOT have additional properties"}]}]);
      })
      .end(done);
  });

  it.skip('GET settings - request fails for X-address with tag', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const invalidGetSettingsResponse = {
      foo: 'bar'
    }
    sinon.stub(rippleApi, 'request').resolves(invalidGetSettingsResponse);

    request(mockApp)
      .get(path.replace('{address}', 'XV5sbjUmgPpvXv4ixFWZ5ptAYZ6PD28Sq49uo34VyjnmK5H'))
      // .expect(200)
      .expect((x) => {
        // '{"message":"Error","errors":[{"name":"Error","message":"This command does not support the use of a tag. Use an address without a tag.","code":1000}]}'
        // console.log(x);
        // expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[31m%s\u001b[0m","/accounts/{address}/info: validation:",{"message":"The response was not valid.","errors":[{"path":"account_data","errorCode":"additionalProperties.openapi.responseValidation","message":"account_data should NOT have additional properties"}]}]);
      })
      .end(done);
  });

  it('GET settings - fails if rippled returns an invalid result', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const invalidGetSettingsResponse = {
      foo: 'bar'
    }
    sinon.stub(rippleApi, 'request').resolves(invalidGetSettingsResponse);

    request(mockApp)
      .get(path.replace('{address}', 'XV5sbjUmgPpvXv4ixFWZ5ptAYZ6PD2gYsjNFQLKYW33DzBm'))
      .expect(400)
      .expect('{"message":"TypeError","errors":[{"name":"TypeError","message":"Cannot read property \'Flags\' of undefined","code":1000}]}')
      .end(done);
  });
});
