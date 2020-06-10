import request from 'supertest';
import { mockApp, rippleApi, mockedDebuglog } from "../../../../fixtures/mocks";
import sinon from 'sinon';
import { expect } from 'chai';
import { capture } from 'ts-mockito';

const path = '/v3/accounts/{address}/settings';

describe(path, () => {
  it('GET settings - returns account settings', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const getSettingsResponse = {
      "requireDestinationTag": true,
      "disallowIncomingXRP": true,
      "emailHash": "23463B99B62A72F26ED677CC556C44E8",
      "walletLocator": "00000000000000000000000000000000000000000000000000000000DEADBEEF",
      "domain": "example.com",
      "transferRate": 1.002,
      "tickSize": 5,
      "signers": {
        "threshold": 3,
        "weights": [
          {
            "address": "rpHit3GvUR1VSGh2PXcaaZKEEUnCVxWU2i",
            "weight": 1
          }, {
            "address": "rN4oCm1c6BQz6nru83H52FBSpNbC9VQcRc",
            "weight": 1
          }, {
            "address": "rJ8KhCi67VgbapiKCQN3r1ZA6BMUxUvvnD",
            "weight": 1
          }
        ]
      }
    };
    sinon.stub(rippleApi, 'getSettings').resolves(getSettingsResponse);

    request(mockApp)
      .get(path.replace('{address}', 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59'))
      .expect(200)
      .expect(getSettingsResponse)
      .expect(() => {
        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","/v3/accounts/r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59/settings response validated"]);
      })
      .end(done);
  });

  it('GET settings - passes along ledger_index', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const getSettingsResponse = {
      "requireDestinationTag": true,
      "disallowIncomingXRP": true,
      "emailHash": "23463B99B62A72F26ED677CC556C44E8",
      "walletLocator": "00000000000000000000000000000000000000000000000000000000DEADBEEF",
      "domain": "example.com",
      "transferRate": 1.002,
      "tickSize": 5,
      "signers": {
        "threshold": 3,
        "weights": [
          {
            "address": "rpHit3GvUR1VSGh2PXcaaZKEEUnCVxWU2i",
            "weight": 1
          }, {
            "address": "rN4oCm1c6BQz6nru83H52FBSpNbC9VQcRc",
            "weight": 1
          }, {
            "address": "rJ8KhCi67VgbapiKCQN3r1ZA6BMUxUvvnD",
            "weight": 1
          }
        ]
      }
    };
    sinon.stub(rippleApi, 'getSettings').withArgs('r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59', {
      ledgerVersion: 'validated'
    } as any).resolves(getSettingsResponse); // eslint-disable-line @typescript-eslint/no-explicit-any

    request(mockApp)
      .get(path.replace('{address}', 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59') + '?ledger_index=validated')
      .expect(200)
      .expect(getSettingsResponse)
      .expect(() => {
        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","/v3/accounts/r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59/settings response validated"]);
      })
      .end(done);
  });

  it('GET settings - invalid response from RippleAPI triggers response validation error', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const invalidGetSettingsResponse = {
      foo: 'bar'
    };
    sinon.stub(rippleApi, 'getSettings').resolves(invalidGetSettingsResponse as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    request(mockApp)
      .get(path)
      .expect(200)
      .expect((x) => {
        expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[31m%s\u001b[0m","/v3/accounts/{address}/settings validation:",{"message":"The response was not valid.","errors":[{"path":"response","errorCode":"additionalProperties.openapi.responseValidation","message":"should NOT have additional properties"}]}]);
      })
      .end(done);
  });

  it('GET settings - request fails for X-address with tag', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const invalidGetSettingsResponse = {
      foo: 'bar'
    };
    sinon.stub(rippleApi, 'request').resolves(invalidGetSettingsResponse);

    request(mockApp)
      .get(path.replace('{address}', 'XV5sbjUmgPpvXv4ixFWZ5ptAYZ6PD28Sq49uo34VyjnmK5H'))
      .expect(400)
      .expect({
        message: 'Error',
        errors: [ {
          name: 'Error',
          message:
            'This command does not support the use of a tag. Use an address without a tag.',
          code: 1000
        } ]
      })
      .end(done);
  });

  it('GET settings - fails if RippleAPI returns an invalid result', (done) => {
    sinon.stub(rippleApi, 'isConnected').returns(true);
    const invalidGetSettingsResponse = {
      foo: 'bar'
    };
    sinon.stub(rippleApi, 'request').resolves(invalidGetSettingsResponse);

    request(mockApp)
      .get(path.replace('{address}', 'XV5sbjUmgPpvXv4ixFWZ5ptAYZ6PD2gYsjNFQLKYW33DzBm'))
      .expect(400)
      .expect('{"message":"TypeError","errors":[{"name":"TypeError","message":"Cannot read property \'Flags\' of undefined","code":1000}]}')
      .end(done);
  });
});
