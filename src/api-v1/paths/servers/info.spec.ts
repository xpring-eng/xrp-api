import request from 'supertest';
import { mockApp, rippleApi, mockedDebuglog } from "../../../../test/mocks";
import { expect } from 'chai';
import sinon from 'sinon';
import { capture } from 'ts-mockito';
import getServerInfoFixture from '../../../../test/fixtures/getServerInfo.json';
const path = '/v1/servers/info';

describe(path, () => {
  it('GET - returns server info', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    sinon.stub(rippleApi, 'getServerInfo').resolves(getServerInfoFixture);
    
    request(mockApp)
      .get(path)
      .expect(200)
      .expect(res => {
        expect(res.text.length).to.be.greaterThan(1800).lessThan(1900);
        
        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","response validated"]);
      })
      .end(done);
  });

  it('GET - when not connected, returns server version and empty rippled_servers array', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(false);
    const getServerInfoStub = sinon.stub(rippleApi, 'getServerInfo');

    request(mockApp)
      .get(path)
      .expect(200)
      .expect(res => {
        const obj = JSON.parse(res.text);
        expect(obj.server_version).to.be.a('string');
        expect(obj.rippled_servers).to.be.an('array').that.is.empty;
        expect(res.text.length).to.be.greaterThan(40).lessThan(50);

        sinon.assert.notCalled(getServerInfoStub);
      })
      .end(done);
  });

  it('GET - fails validation when response is invalid', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    sinon.stub(rippleApi, 'getServerInfo').resolves(Object.assign({}, getServerInfoFixture, {foo: 'bar'}));

    request(mockApp)
      .get(path)
      .expect(200)
      .expect(() => {
        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[31m%s\u001b[0m","validation:",{"message":"The response was not valid.","errors":[{"path":"rippled_servers[0]","errorCode":"additionalProperties.openapi.responseValidation","message":"rippled_servers[0] should NOT have additional properties"}]}]);
      })
      .end(done);
  });

  afterEach(() => {
    sinon.restore();
  });
});
