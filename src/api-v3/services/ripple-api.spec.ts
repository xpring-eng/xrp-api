// TODO
// import request from 'supertest';
// import { mockApp, rippleApi, mockedDebuglog } from "../../../../../test/mocks";
// import { expect } from 'chai';
// import sinon from 'sinon';
// import { capture } from 'ts-mockito';

// const fixture_getAccountInfo = require('../../../../../test/fixtures/getAccountInfo');
// const path = '/v3/accounts/{address}/info';

// describe(path, () => {
//   it('GET - returns account info', (done) => {
//     sinon.stub(rippleApi, 'isConnected').returns(true);
//     sinon.stub(rippleApi, 'request').resolves(fixture_getAccountInfo);

//     request(mockApp)
//       .get(path)
//       .expect(200)
//       .expect(res => {
//         expect(res.text.length).to.be.greaterThan(400).lessThan(500);

//         expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[32m%s\u001b[0m","response validated"]);
//       })
//       .end(done);
//   });

// // rippleApi is stubbed, so we can't (and shouldn't) test it here - test it elsewhere...
// // when testing rippleApi, make sure this path is not whitelisted
//   it('GET - when not connected, returns an error', (done) => {
//     const apiConnectError = {
//       "name": "NotConnectedError",
//       "data": {
//         "errno": "ECONNREFUSED",
//         "code": "ECONNREFUSED",
//         "syscall": "connect",
//         "address": "127.0.0.1",
//         "port": 6006
//       }
//     };

//     const expectedError = {
//       "errors": [
//         {
//           "name": "NotConnectedError",
//           "data": {
//             "errno": "ECONNREFUSED",
//             "code": "ECONNREFUSED",
//             "syscall": "connect",
//             "address": "127.0.0.1",
//             "port": 6006
//           }
//         }
//       ]
//     };

//     sinon.stub(rippleApi, 'connect').rejects(apiConnectError);

//     request(mockApp)
//       .get(path)
//       .expect(res => {
//         console.log(JSON.stringify(capture(mockedDebuglog.log).first()));

//         // console.log(res.body);
//       })
//       // .expect(500) // TODO try changing
//       // .expect(res => {
//       //   const obj = JSON.parse(res.text);
//       //   expect(obj.server_version).to.be.a('string');
//       //   expect(obj.rippled_servers).to.be.an('array').that.is.empty;
//       //   expect(res.text.length).to.be.greaterThan(40).lessThan(50);

//       //   sinon.assert.notCalled(getServerInfoStub);
//       // })
//       // .expect(expectedError)
//       .end(done);
//   });

//   // TODO: test with different ledger_index

//   it('GET - fails validation when response is invalid', (done) => {
//     sinon.stub(rippleApi, 'isConnected').returns(true);
//     sinon.stub(rippleApi, 'getServerInfo').resolves(Object.assign({}, fixture_getAccountInfo, {foo: 'bar'}));

//     request(mockApp)
//       .get(path)
//       .expect(200)
//       .expect(() => {
//         expect(capture(mockedDebuglog.log).first()).to.deep.equal(["\u001b[31m%s\u001b[0m","validation:",{"message":"The response was not valid.","errors":[{"path":"rippled_servers[0]","errorCode":"additionalProperties.openapi.responseValidation","message":"rippled_servers[0] should NOT have additional properties"}]}]); // TODO
//       })
//       .end(done);
//   });

//   afterEach(() => {
//     sinon.restore();
//   });
// });
